"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR<User | null>("auth-user", async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  })

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    mutate(null)
  }

  return {
    user: data,
    isLoading,
    error,
    signOut,
    mutate,
  }
}
