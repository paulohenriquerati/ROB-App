/**
 * AAX Converter Utility
 * 
 * Provides FFmpeg-based conversion from AAX (Audible) format to web-playable formats.
 * Also extracts cover art and metadata from AAX files.
 * 
 * REQUIREMENTS:
 * - FFmpeg must be installed on the server and accessible via PATH
 * - For Windows: Download from https://ffmpeg.org/download.html
 * - For Linux: apt-get install ffmpeg
 */

import ffmpeg from 'fluent-ffmpeg'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

/**
 * Metadata extracted from AAX file
 */
export interface AaxMetadata {
    title: string
    author: string
    narrator: string
    duration: number // seconds
    coverPath: string | null
    chapters: Array<{
        title: string
        start: number
        end: number
    }>
}

/**
 * Conversion result
 */
export interface ConversionResult {
    success: boolean
    outputPath: string | null
    coverPath: string | null
    metadata: AaxMetadata | null
    error: string | null
}

/**
 * Check if FFmpeg is available on the system
 */
export async function checkFfmpegAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
        ffmpeg.getAvailableFormats((err) => {
            resolve(!err)
        })
    })
}

/**
 * Extract metadata from AAX file using ffprobe
 */
export async function extractAaxMetadata(inputPath: string): Promise<AaxMetadata> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err, data) => {
            if (err) {
                console.error('FFprobe error:', err)
                reject(err)
                return
            }

            const format = data.format
            const tags = format.tags || {}

            // Extract chapter information
            const chapters = (data.chapters || []).map((chapter: any) => ({
                title: chapter.tags?.title || `Chapter ${chapter.id + 1}`,
                start: Math.round(parseFloat(chapter.start_time) || 0),
                end: Math.round(parseFloat(chapter.end_time) || 0),
            }))

            resolve({
                title: String(tags.title || tags.TITLE || 'Unknown Title'),
                author: String(tags.author || tags.artist || tags.ARTIST || 'Unknown Author'),
                narrator: String(tags.narrator || tags.composer || tags.COMPOSER || ''),
                duration: Math.round(parseFloat(String(format.duration || '0'))),
                coverPath: null, // Will be extracted separately
                chapters,
            })
        })
    })
}

/**
 * Extract cover art from AAX file
 */
export async function extractCoverFromAax(
    inputPath: string,
    outputDir: string
): Promise<string | null> {
    const coverPath = path.join(outputDir, 'cover.jpg')

    return new Promise((resolve) => {
        ffmpeg(inputPath)
            .outputOptions([
                '-an',           // No audio
                '-vcodec', 'mjpeg',  // JPEG codec
                '-frames:v', '1' // Single frame
            ])
            .output(coverPath)
            .on('end', () => {
                resolve(coverPath)
            })
            .on('error', (err) => {
                console.warn('Could not extract cover:', err.message)
                resolve(null)
            })
            .run()
    })
}

/**
 * Convert AAX to M4B (audiobook format, preserves chapters)
 * 
 * @param inputPath - Path to input AAX file
 * @param outputDir - Directory to write output files
 * @param activationBytes - Audible activation bytes (if DRM protected)
 * @param onProgress - Progress callback (0-100)
 */
export async function convertAaxToM4b(
    inputPath: string,
    outputDir: string,
    activationBytes?: string,
    onProgress?: (percent: number) => void
): Promise<ConversionResult> {
    const outputFileName = path.basename(inputPath, path.extname(inputPath)) + '.m4b'
    const outputPath = path.join(outputDir, outputFileName)

    try {
        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true })

        // Extract metadata first
        const metadata = await extractAaxMetadata(inputPath)

        // Extract cover art
        const coverPath = await extractCoverFromAax(inputPath, outputDir)
        metadata.coverPath = coverPath

        // Build FFmpeg command
        const command = ffmpeg(inputPath)
            .audioCodec('aac')
            .audioBitrate('128k')
            .outputOptions([
                '-vn',  // No video (removes embedded video streams)
                '-map', '0:a',  // Only audio
                '-c:a', 'copy', // Try to copy audio codec first (faster)
            ])
            .output(outputPath)

        // Add activation bytes if provided (for DRM content)
        if (activationBytes) {
            command.inputOptions(['-activation_bytes', activationBytes])
        }

        // Track progress
        command.on('progress', (progress) => {
            if (onProgress && progress.percent) {
                onProgress(Math.round(progress.percent))
            }
        })

        // Execute conversion
        await new Promise<void>((resolve, reject) => {
            command
                .on('end', () => resolve())
                .on('error', (err) => {
                    // If copy fails, try re-encoding
                    console.warn('Copy codec failed, trying re-encode:', err.message)

                    ffmpeg(inputPath)
                        .audioCodec('aac')
                        .audioBitrate('128k')
                        .outputOptions(['-vn', '-map', '0:a'])
                        .output(outputPath)
                        .on('end', () => resolve())
                        .on('error', (err2) => reject(err2))
                        .run()
                })
                .run()
        })

        return {
            success: true,
            outputPath,
            coverPath,
            metadata,
            error: null,
        }
    } catch (error: any) {
        console.error('AAX conversion failed:', error)
        return {
            success: false,
            outputPath: null,
            coverPath: null,
            metadata: null,
            error: error.message || 'Conversion failed',
        }
    }
}

/**
 * Convert AAX to MP3 (smaller file size, widely compatible)
 */
export async function convertAaxToMp3(
    inputPath: string,
    outputDir: string,
    activationBytes?: string,
    bitrate: string = '64k',
    onProgress?: (percent: number) => void
): Promise<ConversionResult> {
    const outputFileName = path.basename(inputPath, path.extname(inputPath)) + '.mp3'
    const outputPath = path.join(outputDir, outputFileName)

    try {
        await fs.mkdir(outputDir, { recursive: true })

        const metadata = await extractAaxMetadata(inputPath)
        const coverPath = await extractCoverFromAax(inputPath, outputDir)
        metadata.coverPath = coverPath

        const command = ffmpeg(inputPath)
            .audioCodec('libmp3lame')
            .audioBitrate(bitrate)
            .outputOptions(['-vn', '-map', '0:a'])
            .output(outputPath)

        if (activationBytes) {
            command.inputOptions(['-activation_bytes', activationBytes])
        }

        command.on('progress', (progress) => {
            if (onProgress && progress.percent) {
                onProgress(Math.round(progress.percent))
            }
        })

        await new Promise<void>((resolve, reject) => {
            command
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run()
        })

        return {
            success: true,
            outputPath,
            coverPath,
            metadata,
            error: null,
        }
    } catch (error: any) {
        console.error('AAX to MP3 conversion failed:', error)
        return {
            success: false,
            outputPath: null,
            coverPath: null,
            metadata: null,
            error: error.message || 'Conversion failed',
        }
    }
}

/**
 * Get a temporary directory for processing
 */
export function getTempDir(): string {
    return path.join(os.tmpdir(), 'audiobook-converter', Date.now().toString())
}

/**
 * Clean up temporary files
 */
export async function cleanupTempDir(dirPath: string): Promise<void> {
    try {
        await fs.rm(dirPath, { recursive: true, force: true })
    } catch (error) {
        console.warn('Failed to cleanup temp dir:', error)
    }
}
