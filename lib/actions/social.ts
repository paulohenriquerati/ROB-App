"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { SharedQuote, Review } from "@/lib/types"

export async function getSharedQuotes(limit = 20) {
  const supabase = await createClient()

  const { data: quotes, error } = await supabase
    .from("shared_quotes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching quotes:", error)
    return { quotes: [], error: error.message }
  }

  return { quotes: quotes as SharedQuote[], error: null }
}

export async function getReviews(limit = 20) {
  const supabase = await createClient()

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching reviews:", error)
    return { reviews: [], error: error.message }
  }

  return { reviews: reviews as Review[], error: null }
}

export async function shareQuote(quoteData: {
  book_id?: string
  book_title: string
  author: string
  text: string
  page: number
  shared_by: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { quote: null, error: "Not authenticated" }
  }

  const { data: quote, error } = await supabase
    .from("shared_quotes")
    .insert({
      ...quoteData,
      user_id: user.id,
      likes: 0,
    })
    .select()
    .single()

  if (error) {
    console.error("Error sharing quote:", error)
    return { quote: null, error: error.message }
  }

  revalidatePath("/")
  return { quote: quote as SharedQuote, error: null }
}

export async function toggleQuoteLike(quoteId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if already liked
  const { data: existingLike } = await supabase
    .from("quote_likes")
    .select("id")
    .eq("quote_id", quoteId)
    .eq("user_id", user.id)
    .single()

  if (existingLike) {
    // Unlike
    await supabase.from("quote_likes").delete().eq("quote_id", quoteId).eq("user_id", user.id)

    await supabase.rpc("decrement_quote_likes", { quote_id: quoteId })
  } else {
    // Like
    await supabase.from("quote_likes").insert({ quote_id: quoteId, user_id: user.id })

    await supabase.rpc("increment_quote_likes", { quote_id: quoteId })
  }

  revalidatePath("/")
  return { success: true, liked: !existingLike, error: null }
}

export async function createReview(reviewData: {
  book_id?: string
  rating: number
  content: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { review: null, error: "Not authenticated" }
  }

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      ...reviewData,
      user_id: user.id,
      user_name: user.email?.split("@")[0] || "Anonymous",
      user_avatar: null,
      likes: 0,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating review:", error)
    return { review: null, error: error.message }
  }

  revalidatePath("/")
  return { review: review as Review, error: null }
}

export async function getUserLikedQuotes() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { likedIds: [], error: "Not authenticated" }
  }

  const { data: likes, error } = await supabase.from("quote_likes").select("quote_id").eq("user_id", user.id)

  if (error) {
    return { likedIds: [], error: error.message }
  }

  return { likedIds: likes.map((l) => l.quote_id), error: null }
}
