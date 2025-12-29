/**
 * AAX Upload & Processing API
 * 
 * POST /api/upload/process-aax
 * 
 * This endpoint handles:
 * 1. Receiving AAX file upload
 * 2. Storing the raw file temporarily
 * 3. Converting to M4B using FFmpeg
 * 4. Extracting metadata and cover art
 * 5. Uploading converted file to storage
 * 6. Updating the book record
 * 
 * NOTE: For production, consider using a background job queue (BullMQ, Redis)
 * for large file processing to avoid request timeouts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
    convertAaxToM4b,
    extractAaxMetadata,
    getTempDir,
    cleanupTempDir,
    checkFfmpegAvailable
} from '@/lib/aax-converter'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for large files

// Route Segment Config for large file uploads
export const fetchCache = 'force-no-store'
export const dynamic = 'force-dynamic'

/**
 * Check FFmpeg availability
 */
export async function GET() {
    const available = await checkFfmpegAvailable()
    return NextResponse.json({
        ffmpegAvailable: available,
        message: available
            ? 'FFmpeg is available for AAX conversion'
            : 'FFmpeg is not installed. Please install FFmpeg to enable AAX conversion.'
    })
}

/**
 * Process AAX file upload
 */
export async function POST(request: NextRequest) {
    const tempDir = getTempDir()

    try {
        // Check FFmpeg availability
        const ffmpegAvailable = await checkFfmpegAvailable()
        if (!ffmpegAvailable) {
            return NextResponse.json(
                { error: 'FFmpeg is not installed on the server. AAX conversion is unavailable.' },
                { status: 503 }
            )
        }

        // Get authenticated user
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Parse multipart form data
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const bookId = formData.get('bookId') as string | null
        const activationBytes = formData.get('activationBytes') as string | null

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Validate file type
        const fileName = file.name.toLowerCase()
        if (!fileName.endsWith('.aax')) {
            return NextResponse.json(
                { error: 'File must be an AAX file' },
                { status: 400 }
            )
        }

        // Create temp directory
        await fs.mkdir(tempDir, { recursive: true })

        // Save uploaded file to temp location
        const inputPath = path.join(tempDir, file.name)
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        await fs.writeFile(inputPath, fileBuffer)

        // Update book status to 'processing' if bookId provided
        if (bookId) {
            await supabase.from('books').update({
                audio_processing_status: 'processing',
                audio_original_filename: file.name,
            }).eq('id', bookId).eq('user_id', user.id)
        }

        // Convert AAX to M4B
        const result = await convertAaxToM4b(
            inputPath,
            tempDir,
            activationBytes || undefined
        )

        if (!result.success || !result.outputPath) {
            // Update book status to 'failed'
            if (bookId) {
                await supabase.from('books').update({
                    audio_processing_status: 'failed',
                }).eq('id', bookId).eq('user_id', user.id)
            }

            return NextResponse.json(
                { error: result.error || 'Conversion failed' },
                { status: 500 }
            )
        }

        // Read converted file
        const convertedBuffer = await fs.readFile(result.outputPath)
        const outputFileName = path.basename(result.outputPath)

        // Upload to Supabase Storage
        const storagePath = `${user.id}/${Date.now()}_${outputFileName}`
        const { error: uploadError } = await supabase.storage
            .from('audiobooks')
            .upload(storagePath, convertedBuffer, {
                contentType: 'audio/mp4',
                upsert: false,
            })

        if (uploadError) {
            throw new Error(`Storage upload failed: ${uploadError.message}`)
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('audiobooks')
            .getPublicUrl(storagePath)

        const audioUrl = urlData.publicUrl

        // Upload cover art if extracted
        let coverUrl: string | null = null
        if (result.coverPath) {
            const coverBuffer = await fs.readFile(result.coverPath)
            const coverStoragePath = `${user.id}/covers/${Date.now()}_cover.jpg`

            const { error: coverUploadError } = await supabase.storage
                .from('book-images')
                .upload(coverStoragePath, coverBuffer, {
                    contentType: 'image/jpeg',
                    upsert: false,
                })

            if (!coverUploadError) {
                const { data: coverUrlData } = supabase.storage
                    .from('book-images')
                    .getPublicUrl(coverStoragePath)
                coverUrl = coverUrlData.publicUrl
            }
        }

        // Prepare book update data
        const bookUpdate: Record<string, any> = {
            audio_url: audioUrl,
            audio_duration: result.metadata?.duration || 0,
            audio_processing_status: 'ready',
            is_audiobook: true,
            audio_source_type: 'file',
        }

        // Add metadata if available
        if (result.metadata) {
            if (result.metadata.narrator) {
                bookUpdate.audio_narrator = result.metadata.narrator
            }
            // Only update title/author if creating new book
            if (!bookId) {
                bookUpdate.title = result.metadata.title
                bookUpdate.author = result.metadata.author
            }
        }

        // Add cover if extracted
        if (coverUrl) {
            bookUpdate.cover_url = coverUrl
        }

        // Update or create book record
        if (bookId) {
            await supabase.from('books').update(bookUpdate)
                .eq('id', bookId)
                .eq('user_id', user.id)
        } else {
            // Create new book entry
            const { data: newBook, error: insertError } = await supabase.from('books').insert({
                ...bookUpdate,
                user_id: user.id,
                total_pages: 0,
                rating: 0,
            }).select().single()

            if (insertError) {
                throw new Error(`Failed to create book record: ${insertError.message}`)
            }
        }

        // Cleanup temp files
        await cleanupTempDir(tempDir)

        return NextResponse.json({
            success: true,
            audioUrl,
            coverUrl,
            metadata: result.metadata,
            message: 'AAX file converted successfully',
        })

    } catch (error: any) {
        console.error('AAX processing error:', error)

        // Cleanup on error
        await cleanupTempDir(tempDir)

        return NextResponse.json(
            { error: error.message || 'Processing failed' },
            { status: 500 }
        )
    }
}
