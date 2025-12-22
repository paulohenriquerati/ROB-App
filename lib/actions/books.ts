"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Book } from "@/lib/types"

export async function getBooks() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { books: [], error: "Not authenticated" }
  }

  const { data: books, error } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", user.id)
    .order("last_read", { ascending: false, nullsFirst: false })

  if (error) {
    console.error("Error fetching books:", error)
    return { books: [], error: error.message }
  }

  return { books: books as Book[], error: null }
}

export async function createBook(bookData: {
  title: string
  author: string
  cover_url?: string
  total_pages: number
  pdf_url?: string
  genre?: string
  description?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { book: null, error: "Not authenticated" }
  }

  const { data: book, error } = await supabase
    .from("books")
    .insert({
      ...bookData,
      user_id: user.id,
      rating: 0,
      current_page: 0,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating book:", error)
    return { book: null, error: error.message }
  }

  revalidatePath("/")
  return { book: book as Book, error: null }
}

export async function updateBook(bookId: string, updates: Partial<Omit<Book, "id" | "user_id" | "created_at">>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { book: null, error: "Not authenticated" }
  }

  const { data: book, error } = await supabase
    .from("books")
    .update(updates)
    .eq("id", bookId)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating book:", error)
    return { book: null, error: error.message }
  }

  revalidatePath("/")
  return { book: book as Book, error: null }
}

export async function deleteBook(bookId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase.from("books").delete().eq("id", bookId).eq("user_id", user.id)

  if (error) {
    console.error("Error deleting book:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/")
  return { success: true, error: null }
}

export async function updateReadingProgress(bookId: string, currentPage: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("books")
    .update({
      current_page: currentPage,
      last_read: new Date().toISOString(),
    })
    .eq("id", bookId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error updating reading progress:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/")
  return { success: true, error: null }
}

export async function rateBook(bookId: string, rating: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase.from("books").update({ rating }).eq("id", bookId).eq("user_id", user.id)

  if (error) {
    console.error("Error rating book:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/")
  return { success: true, error: null }
}
