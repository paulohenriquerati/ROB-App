"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { PageContent, TranscriptionStatus } from "@/lib/types"

const BUCKET_NAME = "book-images"

/**
 * Upload an extracted image to Supabase Storage
 */
export async function uploadBookImage(
    imageData: string,
    bookId: string,
    pageNumber: number,
    imageIndex: number
): Promise<string | null> {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    try {
        // Convert base64 to blob
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "")
        const buffer = Buffer.from(base64Data, "base64")

        // Generate unique filename
        const timestamp = Date.now()
        const filePath = `${user.id}/${bookId}/page_${pageNumber}_img_${imageIndex}_${timestamp}.jpg`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, buffer, {
                contentType: "image/jpeg",
                cacheControl: "3600",
                upsert: false,
            })

        if (error) {
            console.error("Error uploading book image:", error)
            return null
        }

        // Get public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path)

        // Also save to book_images table for tracking
        await supabase.from("book_images").insert({
            book_id: bookId,
            page_number: pageNumber,
            image_url: publicUrl,
        })

        return publicUrl
    } catch (error) {
        console.error("Error in image upload:", error)
        return null
    }
}

/**
 * Update book transcription status
 */
export async function updateTranscriptionStatus(
    bookId: string,
    status: TranscriptionStatus,
    progress?: number
) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Not authenticated" }
    }

    const updates: Record<string, any> = { transcription_status: status }
    if (progress !== undefined) {
        updates.transcription_progress = progress
    }

    const { error } = await supabase
        .from("books")
        .update(updates)
        .eq("id", bookId)
        .eq("user_id", user.id)

    if (error) {
        console.error("Error updating transcription status:", error)
        return { success: false, error: error.message }
    }

    revalidatePath("/")
    return { success: true, error: null }
}

/**
 * Save transcribed page content to database
 */
export async function savePageContent(
    bookId: string,
    pageContent: PageContent
) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase.from("book_content").upsert(
        {
            book_id: bookId,
            page_number: pageContent.pageNumber,
            content: { blocks: pageContent.blocks },
            text_content: pageContent.textContent,
            updated_at: new Date().toISOString(),
        },
        { onConflict: "book_id,page_number" }
    )

    if (error) {
        console.error("Error saving page content:", error)
        return { success: false, error: error.message }
    }

    return { success: true, error: null }
}

/**
 * Get transcribed content for a book
 */
export async function getBookContent(bookId: string): Promise<{
    pages: PageContent[]
    error: string | null
}> {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { pages: [], error: "Not authenticated" }
    }

    const { data, error } = await supabase
        .from("book_content")
        .select("*")
        .eq("book_id", bookId)
        .order("page_number", { ascending: true })

    if (error) {
        console.error("Error fetching book content:", error)
        return { pages: [], error: error.message }
    }

    // Transform database format to PageContent format
    const pages: PageContent[] = (data || []).map((row) => ({
        pageNumber: row.page_number,
        blocks: row.content?.blocks || [],
        textContent: row.text_content || "",
        hasImages: row.content?.blocks?.some((b: any) => b.type === "image") || false,
        extractedAt: row.created_at,
    }))

    return { pages, error: null }
}

/**
 * Delete all transcribed content for a book
 */
export async function deleteBookContent(bookId: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Not authenticated" }
    }

    // Delete content
    const { error: contentError } = await supabase
        .from("book_content")
        .delete()
        .eq("book_id", bookId)

    // Delete images from storage
    const { data: images } = await supabase
        .from("book_images")
        .select("image_url")
        .eq("book_id", bookId)

    if (images && images.length > 0) {
        // Extract file paths and delete from storage
        const filePaths = images
            .map((img) => {
                try {
                    const url = new URL(img.image_url)
                    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/book-images\/(.+)/)
                    return pathMatch ? pathMatch[1] : null
                } catch {
                    return null
                }
            })
            .filter(Boolean) as string[]

        if (filePaths.length > 0) {
            await supabase.storage.from(BUCKET_NAME).remove(filePaths)
        }
    }

    // Delete image records
    await supabase.from("book_images").delete().eq("book_id", bookId)

    // Reset transcription status
    await supabase
        .from("books")
        .update({
            transcription_status: "pending",
            transcription_progress: 0,
        })
        .eq("id", bookId)
        .eq("user_id", user.id)

    if (contentError) {
        console.error("Error deleting book content:", contentError)
        return { success: false, error: contentError.message }
    }

    revalidatePath("/")
    return { success: true, error: null }
}

/**
 * Search within transcribed book content
 */
export async function searchBookContent(
    bookId: string,
    query: string
): Promise<{
    results: { pageNumber: number; snippet: string }[]
    error: string | null
}> {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { results: [], error: "Not authenticated" }
    }

    // Use PostgreSQL full-text search
    const { data, error } = await supabase
        .from("book_content")
        .select("page_number, text_content")
        .eq("book_id", bookId)
        .textSearch("text_content", query, {
            type: "websearch",
            config: "portuguese",
        })

    if (error) {
        console.error("Error searching book content:", error)
        return { results: [], error: error.message }
    }

    // Create result snippets
    const results = (data || []).map((row) => {
        const text = row.text_content || ""
        const lowerText = text.toLowerCase()
        const lowerQuery = query.toLowerCase()
        const pos = lowerText.indexOf(lowerQuery)

        let snippet = ""
        if (pos !== -1) {
            const start = Math.max(0, pos - 50)
            const end = Math.min(text.length, pos + query.length + 50)
            snippet = (start > 0 ? "..." : "") + text.slice(start, end) + (end < text.length ? "..." : "")
        } else {
            snippet = text.slice(0, 100) + (text.length > 100 ? "..." : "")
        }

        return {
            pageNumber: row.page_number,
            snippet,
        }
    })

    return { results, error: null }
}
