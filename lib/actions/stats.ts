"use server"

import { createClient } from "@/lib/supabase/server"
import type { ReadingStats, ReadingSession } from "@/lib/types"

export async function getReadingStats() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { stats: null, error: "Not authenticated" }
  }

  // Get or create stats record
  let { data: stats, error } = await supabase.from("reading_stats").select("*").eq("user_id", user.id).single()

  if (error && error.code === "PGRST116") {
    // No stats record exists, create one
    const { data: newStats, error: createError } = await supabase
      .from("reading_stats")
      .insert({ user_id: user.id })
      .select()
      .single()

    if (createError) {
      console.error("Error creating stats:", createError)
      return { stats: null, error: createError.message }
    }
    stats = newStats
  } else if (error) {
    console.error("Error fetching stats:", error)
    return { stats: null, error: error.message }
  }

  return { stats: stats as ReadingStats, error: null }
}

export async function getReadingSessions(days = 7) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { sessions: [], error: "Not authenticated" }
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: sessions, error } = await supabase
    .from("reading_sessions")
    .select("*")
    .eq("user_id", user.id)
    .gte("start_time", startDate.toISOString())
    .order("start_time", { ascending: false })

  if (error) {
    console.error("Error fetching sessions:", error)
    return { sessions: [], error: error.message }
  }

  return { sessions: sessions as ReadingSession[], error: null }
}

export async function startReadingSession(bookId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { session: null, error: "Not authenticated" }
  }

  const { data: session, error } = await supabase
    .from("reading_sessions")
    .insert({
      book_id: bookId,
      user_id: user.id,
      start_time: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("Error starting session:", error)
    return { session: null, error: error.message }
  }

  return { session: session as ReadingSession, error: null }
}

export async function endReadingSession(sessionId: string, pagesRead: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("reading_sessions")
    .update({
      end_time: new Date().toISOString(),
      pages_read: pagesRead,
    })
    .eq("id", sessionId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error ending session:", error)
    return { success: false, error: error.message }
  }

  // Update reading stats
  await updateReadingStats(user.id, pagesRead)

  return { success: true, error: null }
}

async function updateReadingStats(userId: string, pagesRead: number) {
  const supabase = await createClient()

  // Get current stats
  const { data: stats } = await supabase.from("reading_stats").select("*").eq("user_id", userId).single()

  if (!stats) return

  const today = new Date().toISOString().split("T")[0]
  const lastReadDate = stats.last_read_date

  let newStreak = stats.current_streak
  if (lastReadDate !== today) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split("T")[0]

    if (lastReadDate === yesterdayStr) {
      newStreak += 1
    } else {
      newStreak = 1
    }
  }

  await supabase
    .from("reading_stats")
    .update({
      total_pages_read: stats.total_pages_read + pagesRead,
      current_streak: newStreak,
      longest_streak: Math.max(stats.longest_streak, newStreak),
      last_read_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
}
