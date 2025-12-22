"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { Book } from "@/lib/types"

export function useBooks() {
  const { data, error, isLoading, mutate } = useSWR<Book[]>("books", async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const { data: books, error } = await supabase
      .from("books")
      .select("*")
      .eq("user_id", user.id)
      .order("last_read", { ascending: false, nullsFirst: false })

    if (error) throw error
    return books as Book[]
  })

  return {
    books: data || [],
    isLoading,
    error,
    mutate,
  }
}

export function useBook(bookId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Book | null>(bookId ? `book-${bookId}` : null, async () => {
    if (!bookId) return null

    const supabase = createClient()
    const { data: book, error } = await supabase.from("books").select("*").eq("id", bookId).single()

    if (error) throw error
    return book as Book
  })

  return {
    book: data,
    isLoading,
    error,
    mutate,
  }
}
