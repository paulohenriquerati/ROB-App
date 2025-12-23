"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Highlight } from "@/lib/types"

/**
 * Get all highlights for a book, optionally filtered by page
 */
export async function getHighlights(bookId: string, page?: number) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { highlights: [], error: "Not authenticated" }
    }

    let query = supabase
        .from("highlights")
        .select("*")
        .eq("book_id", bookId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

    if (page !== undefined) {
        query = query.eq("page", page)
    }

    const { data: highlights, error } = await query

    if (error) {
        console.error("Error fetching highlights:", error)
        return { highlights: [], error: error.message }
    }

    return { highlights: highlights as Highlight[], error: null }
}

/**
 * Create a new highlight
 */
export async function createHighlight(data: {
    book_id: string
    page: number
    text: string
    color: "yellow" | "green" | "blue" | "pink"
    start_offset?: number
    end_offset?: number
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { highlight: null, error: "Not authenticated" }
    }

    const { data: highlight, error } = await supabase
        .from("highlights")
        .insert({
            ...data,
            user_id: user.id,
        })
        .select()
        .single()

    if (error) {
        console.error("Error creating highlight:", error)
        return { highlight: null, error: error.message }
    }

    revalidatePath("/")
    return { highlight: highlight as Highlight, error: null }
}

/**
 * Update a highlight's color
 */
export async function updateHighlightColor(
    highlightId: string,
    color: "yellow" | "green" | "blue" | "pink"
) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
        .from("highlights")
        .update({ color })
        .eq("id", highlightId)
        .eq("user_id", user.id)

    if (error) {
        console.error("Error updating highlight:", error)
        return { success: false, error: error.message }
    }

    revalidatePath("/")
    return { success: true, error: null }
}

/**
 * Delete a highlight
 */
export async function deleteHighlight(highlightId: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
        .from("highlights")
        .delete()
        .eq("id", highlightId)
        .eq("user_id", user.id)

    if (error) {
        console.error("Error deleting highlight:", error)
        return { success: false, error: error.message }
    }

    revalidatePath("/")
    return { success: true, error: null }
}
