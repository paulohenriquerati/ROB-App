/**
 * Audio Utilities
 * 
 * Provides functions for:
 * - Detecting audio file types
 * - Extracting ID3 metadata (cover, title, author, duration)
 * - Getting audio duration from URL
 */

// Supported audio MIME types
export const AUDIO_MIME_TYPES = [
    'audio/mpeg',      // MP3
    'audio/mp4',       // M4A
    'audio/x-m4b',     // M4B (Audible)
    'audio/x-m4a',     // M4A variant
    'audio/wav',       // WAV
    'audio/ogg',       // OGG
    'audio/webm',      // WebM
    'audio/vnd.audible.aax',  // Audible AAX
    'audio/x-aax',     // AAX variant
    'audio/aax',       // AAX variant
] as const

// Supported audio file extensions
export const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.m4b', '.wav', '.ogg', '.webm', '.aax'] as const

/**
 * Audio metadata extracted from file
 */
export interface AudioMetadata {
    title: string
    author: string
    coverUrl: string | null
    coverBlob: Blob | null
    duration: number  // seconds
    format: string
}

/**
 * Check if a file is an audio file
 */
export function isAudioFile(file: File): boolean {
    // Check MIME type
    if (AUDIO_MIME_TYPES.includes(file.type as any)) {
        return true
    }

    // Fallback: check extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    return AUDIO_EXTENSIONS.includes(extension as any)
}

/**
 * Check if a file is an AAX (Audible) file that requires conversion
 */
export function isAaxFile(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase()
    return extension === 'aax' ||
        file.type === 'audio/vnd.audible.aax' ||
        file.type === 'audio/x-aax' ||
        file.type === 'audio/aax'
}

/**
 * Check if a file is a PDF
 */
export function isPdfFile(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

/**
 * Get file type category
 */
export function getFileCategory(file: File): 'audio' | 'pdf' | 'unknown' {
    if (isAudioFile(file)) return 'audio'
    if (isPdfFile(file)) return 'pdf'
    return 'unknown'
}

/**
 * Extract metadata from audio file using music-metadata-browser
 * Falls back to filename parsing if library not available
 */
export async function extractAudioMetadata(file: File): Promise<AudioMetadata> {
    try {
        // Dynamic import to avoid SSR issues
        const { parseBlob } = await import('music-metadata-browser')

        const metadata = await parseBlob(file)

        // Extract cover art
        let coverUrl: string | null = null
        let coverBlob: Blob | null = null

        if (metadata.common.picture && metadata.common.picture.length > 0) {
            const picture = metadata.common.picture[0]
            coverBlob = new Blob([picture.data], { type: picture.format })
            coverUrl = URL.createObjectURL(coverBlob)
        }

        // Extract duration
        const duration = metadata.format.duration || 0

        // Extract title & author
        const title = metadata.common.title || parseFilename(file.name).title
        const author = metadata.common.artist || metadata.common.albumartist || parseFilename(file.name).author

        return {
            title,
            author,
            coverUrl,
            coverBlob,
            duration: Math.round(duration),
            format: metadata.format.codec || 'Unknown',
        }
    } catch (error) {
        console.warn('Failed to extract audio metadata, using fallback:', error)

        // Fallback: parse filename and get duration from Audio element
        const parsed = parseFilename(file.name)
        const duration = await getAudioDurationFromFile(file)

        return {
            title: parsed.title,
            author: parsed.author,
            coverUrl: null,
            coverBlob: null,
            duration,
            format: 'Unknown',
        }
    }
}

/**
 * Parse filename to extract title and author
 * Handles patterns like:
 * - "Author - Title.mp3"
 * - "Title - Author.mp3"
 * - "Title.mp3"
 */
function parseFilename(filename: string): { title: string; author: string } {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')

    // Try to split by common separators
    const separators = [' - ', ' – ', ' — ', '_-_']

    for (const sep of separators) {
        if (nameWithoutExt.includes(sep)) {
            const parts = nameWithoutExt.split(sep)
            if (parts.length >= 2) {
                return {
                    author: parts[0].trim(),
                    title: parts.slice(1).join(sep).trim(),
                }
            }
        }
    }

    // No separator found, use filename as title
    return {
        title: nameWithoutExt.trim(),
        author: 'Unknown Author',
    }
}

/**
 * Get audio duration from a File using HTMLAudioElement
 */
export function getAudioDurationFromFile(file: File): Promise<number> {
    return new Promise((resolve) => {
        const audio = new Audio()
        const objectUrl = URL.createObjectURL(file)

        audio.addEventListener('loadedmetadata', () => {
            URL.revokeObjectURL(objectUrl)
            resolve(Math.round(audio.duration))
        })

        audio.addEventListener('error', () => {
            URL.revokeObjectURL(objectUrl)
            resolve(0)
        })

        audio.src = objectUrl
    })
}

/**
 * Get audio duration from a URL
 */
export function getAudioDurationFromUrl(url: string): Promise<number> {
    return new Promise((resolve) => {
        const audio = new Audio()

        audio.addEventListener('loadedmetadata', () => {
            resolve(Math.round(audio.duration))
        })

        audio.addEventListener('error', () => {
            resolve(0)
        })

        audio.src = url
    })
}

/**
 * Format duration in seconds to human readable string
 * @example formatDuration(3661) => "1h 1min"
 */
export function formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '0min'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
        return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
}

/**
 * Format duration for player display
 * @example formatPlayerTime(3661) => "1:01:01"
 */
export function formatPlayerTime(seconds: number): string {
    if (!seconds || seconds <= 0) return '0:00'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Validate external audio URL
 */
export function isValidAudioUrl(url: string): boolean {
    try {
        const parsed = new URL(url)

        // Check for common audio hosting patterns
        const audioPatterns = [
            /\.(mp3|m4a|m4b|wav|ogg|webm)$/i,
            /audio/i,
            /audiobook/i,
        ]

        // Check URL path or hostname
        return audioPatterns.some(pattern =>
            pattern.test(parsed.pathname) || pattern.test(parsed.hostname)
        ) || parsed.protocol === 'https:'  // Allow any HTTPS URL as potential audio source
    } catch {
        return false
    }
}
