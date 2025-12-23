"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { Highlight } from "@/lib/types"

/**
 * Hook for fetching and managing highlights for a book
 */
export function useHighlights(bookId: string | null) {
    const { data, error, isLoading, mutate } = useSWR<Highlight[]>(
        bookId ? `highlights-${bookId}` : null,
        async () => {
            if (!bookId) return []

            const supabase = createClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) return []

            const { data: highlights, error } = await supabase
                .from("highlights")
                .select("*")
                .eq("book_id", bookId)
                .eq("user_id", user.id)
                .order("created_at", { ascending: true })

            if (error) throw error
            return highlights as Highlight[]
        }
    )

    /**
     * Get highlights for a specific page
     */
    const getPageHighlights = (page: number): Highlight[] => {
        if (!data) return []
        return data.filter((h) => h.page === page)
    }

    /**
     * Optimistically add a highlight to the cache
     */
    const addHighlight = (highlight: Highlight) => {
        mutate((current) => [...(current || []), highlight], false)
    }

    /**
     * Optimistically remove a highlight from the cache
     */
    const removeHighlight = (highlightId: string) => {
        mutate(
            (current) => (current || []).filter((h) => h.id !== highlightId),
            false
        )
    }

    /**
     * Optimistically update a highlight's color in the cache
     */
    const updateColor = (
        highlightId: string,
        color: "yellow" | "green" | "blue" | "pink"
    ) => {
        mutate(
            (current) =>
                (current || []).map((h) =>
                    h.id === highlightId ? { ...h, color } : h
                ),
            false
        )
    }

    return {
        highlights: data || [],
        isLoading,
        error,
        mutate,
        getPageHighlights,
        addHighlight,
        removeHighlight,
        updateColor,
    }
}
