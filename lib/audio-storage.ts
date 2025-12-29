/**
 * Audio Storage Utilities
 * 
 * Handles uploading and managing audio files in Supabase Storage
 */

import { createClient } from '@/lib/supabase/client'

const AUDIO_BUCKET = 'audiobooks'

/**
 * Upload an audio file to Supabase Storage
 * @returns The public URL of the uploaded file
 */
export async function uploadAudioFile(
    file: File,
    userId: string,
    onProgress?: (progress: number) => void
): Promise<string | null> {
    const supabase = createClient()

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${userId}/${timestamp}_${sanitizedName}`

    // Determine content type based on file extension
    const extension = file.name.toLowerCase().split('.').pop()
    const mimeTypes: Record<string, string> = {
        'mp3': 'audio/mpeg',
        'm4a': 'audio/mp4',
        'm4b': 'audio/mp4',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'aax': 'audio/vnd.audible.aax',
        'flac': 'audio/flac',
    }
    const contentType = mimeTypes[extension || ''] || file.type || 'audio/mpeg'

    try {
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(AUDIO_BUCKET)
            .upload(filePath, file, {
                cacheControl: '3600',
                contentType,
                upsert: false,
            })

        if (error) {
            console.error('Audio upload error:', error)
            return null
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(AUDIO_BUCKET)
            .getPublicUrl(filePath)

        return urlData.publicUrl
    } catch (error) {
        console.error('Failed to upload audio file:', error)
        return null
    }
}

/**
 * Upload cover image extracted from audio metadata
 * @returns The public URL of the uploaded cover
 */
export async function uploadAudioCover(
    coverBlob: Blob,
    userId: string,
    bookTitle: string
): Promise<string | null> {
    const supabase = createClient()

    // Generate filename
    const timestamp = Date.now()
    const sanitizedTitle = bookTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)
    const filePath = `${userId}/covers/${timestamp}_${sanitizedTitle}.jpg`

    try {
        // Upload to book-images bucket (reuse existing bucket)
        const { data, error } = await supabase.storage
            .from('book-images')
            .upload(filePath, coverBlob, {
                cacheControl: '3600',
                contentType: 'image/jpeg',
                upsert: false,
            })

        if (error) {
            console.error('Cover upload error:', error)
            return null
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('book-images')
            .getPublicUrl(filePath)

        return urlData.publicUrl
    } catch (error) {
        console.error('Failed to upload cover:', error)
        return null
    }
}

/**
 * Delete an audio file from storage
 */
export async function deleteAudioFile(audioUrl: string): Promise<boolean> {
    const supabase = createClient()

    try {
        // Extract file path from URL
        const url = new URL(audioUrl)
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/audiobooks\/(.+)/)

        if (!pathMatch) {
            console.error('Could not extract file path from URL')
            return false
        }

        const filePath = decodeURIComponent(pathMatch[1])

        const { error } = await supabase.storage
            .from(AUDIO_BUCKET)
            .remove([filePath])

        if (error) {
            console.error('Failed to delete audio file:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('Error deleting audio file:', error)
        return false
    }
}

/**
 * Check if an audio file exists at the given URL
 */
export async function checkAudioExists(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, { method: 'HEAD' })
        return response.ok
    } catch {
        return false
    }
}
