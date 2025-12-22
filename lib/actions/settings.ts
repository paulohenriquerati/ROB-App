"use server"

import { createClient } from "@/lib/supabase/server"
import type { UserSettings } from "@/lib/types"

export async function getUserSettings() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { settings: null, error: "Not authenticated" }
  }

  let { data: settings, error } = await supabase.from("user_settings").select("*").eq("user_id", user.id).single()

  if (error && error.code === "PGRST116") {
    // No settings exist, create default
    const { data: newSettings, error: createError } = await supabase
      .from("user_settings")
      .insert({ user_id: user.id })
      .select()
      .single()

    if (createError) {
      console.error("Error creating settings:", createError)
      return { settings: null, error: createError.message }
    }
    settings = newSettings
  } else if (error) {
    console.error("Error fetching settings:", error)
    return { settings: null, error: error.message }
  }

  return { settings: settings as UserSettings, error: null }
}

export async function updateUserSettings(updates: Partial<Omit<UserSettings, "id" | "user_id">>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { settings: null, error: "Not authenticated" }
  }

  const { data: settings, error } = await supabase
    .from("user_settings")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating settings:", error)
    return { settings: null, error: error.message }
  }

  return { settings: settings as UserSettings, error: null }
}
