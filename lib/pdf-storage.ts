import { createClient } from "@/lib/supabase/client"

const BUCKET_NAME = "books"

/**
 * Upload a PDF file to Supabase Storage
 * @param file The PDF file to upload
 * @param userId The user's ID to prevent collisions
 * @returns The public URL of the uploaded file, or null if upload fails
 */
export async function uploadPdfToStorage(
    file: File,
    userId: string
): Promise<string | null> {
    const supabase = createClient()

    // Generate a unique filename with timestamp and user ID
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filePath = `${userId}/${timestamp}_${sanitizedName}`

    try {
        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
            })

        if (error) {
            console.error("Error uploading PDF to storage:", error)
            return null
        }

        // Get the public URL for the uploaded file
        const {
            data: { publicUrl },
        } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path)

        return publicUrl
    } catch (error) {
        console.error("Error in PDF upload:", error)
        return null
    }
}

/**
 * Delete a PDF file from Supabase Storage
 * @param pdfUrl The URL of the PDF to delete
 * @param userId The user's ID
 */
export async function deletePdfFromStorage(
    pdfUrl: string,
    userId: string
): Promise<void> {
    if (!pdfUrl || pdfUrl.startsWith("blob:")) return

    const supabase = createClient()

    try {
        // Extract the file path from the URL
        const url = new URL(pdfUrl)
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/books\/(.+)/)
        if (pathMatch && pathMatch[1]) {
            await supabase.storage.from(BUCKET_NAME).remove([pathMatch[1]])
        }
    } catch (error) {
        console.error("Error deleting PDF from storage:", error)
    }
}
