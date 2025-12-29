export interface Book {
  id: string
  title: string
  author: string
  cover_url: string
  rating: number
  total_pages: number
  current_page: number
  last_read: string | null
  created_at: string
  pdf_url: string
  genre?: string
  description?: string
  user_id: string
  // Transcription fields
  transcription_status?: 'pending' | 'processing' | 'completed' | 'failed'
  transcription_progress?: number
  // Audio fields
  is_audiobook?: boolean
  audio_source_type?: 'file' | 'link'
  audio_url?: string
  audio_duration?: number  // seconds
  last_played_position?: number  // seconds
  // Audio processing (AAX conversion)
  audio_processing_status?: 'uploading' | 'processing' | 'ready' | 'failed'
  audio_original_filename?: string
  audio_narrator?: string
}

export interface BookNote {
  id: string
  book_id: string
  user_id: string
  page: number
  content: string
  created_at: string
}

export interface Highlight {
  id: string
  book_id: string
  user_id: string
  page: number
  text: string
  color: "yellow" | "green" | "blue" | "pink"
  start_offset?: number
  end_offset?: number
  created_at: string
}

export interface ReadingSession {
  id: string
  book_id: string
  user_id: string
  start_time: string
  end_time: string | null
  pages_read: number
  created_at: string
}

export interface ReadingStats {
  id: string
  user_id: string
  total_books_read: number
  total_pages_read: number
  total_reading_time: number
  current_streak: number
  longest_streak: number
  last_read_date: string | null
}

export interface UserSettings {
  id: string
  user_id: string
  font_size: "small" | "medium" | "large" | "xlarge"
  font_family: "serif" | "sans" | "mono"
  line_height: "tight" | "normal" | "relaxed"
  theme: "light" | "sepia" | "dark" | "night"
  margins: "narrow" | "normal" | "wide"
  brightness: number
  daily_goal: number
}

export interface ReaderSettings {
  fontSize: "small" | "medium" | "large" | "xlarge"
  fontFamily: "serif" | "sans" | "mono"
  lineHeight: "tight" | "normal" | "relaxed"
  theme: "light" | "sepia" | "dark" | "night"
  margins: "narrow" | "normal" | "wide"
  brightness: number
}

export interface AmbientSound {
  id: string
  name: string
  icon: string
  url: string
}

export interface LibraryFilter {
  search: string
  sortBy: "title" | "rating" | "last_read" | "created_at"
  sortOrder: "asc" | "desc"
}

export interface SharedQuote {
  id: string
  book_id: string | null
  book_title: string
  author: string
  text: string
  page: number
  shared_by: string
  user_id: string
  likes: number
  created_at: string
}

export interface Review {
  id: string
  book_id: string | null
  user_id: string
  user_name: string
  user_avatar: string | null
  rating: number
  content: string
  likes: number
  created_at: string
}

// Legacy camelCase types for component compatibility
export interface BookLegacy {
  id: string
  title: string
  author: string
  coverUrl: string
  rating: number
  totalPages: number
  currentPage: number
  lastRead: Date | null
  createdAt: Date
  pdfUrl: string
  notes: BookNote[]
  highlights: Highlight[]
  readingSessions: ReadingSession[]
  genre?: string
  description?: string
}

// ================================================
// PDF Transcription Types
// ================================================

/**
 * Bounding box for positioned content within a PDF page
 */
export interface ContentBounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Style information for text content
 */
export interface ContentStyle {
  fontSize?: number
  fontFamily?: string
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  color?: string
}

/**
 * A single content block (text, image, or heading) from a PDF page
 */
export interface ContentBlock {
  type: 'text' | 'image' | 'heading' | 'paragraph'
  content?: string // For text/heading blocks
  src?: string // For image blocks - URL to the extracted image
  alt?: string // Alt text for images
  bounds: ContentBounds
  style?: ContentStyle
  order: number // Reading order within the page
}

/**
 * Structured content for a single PDF page
 */
export interface PageContent {
  pageNumber: number
  blocks: ContentBlock[]
  textContent: string // Plain text for search/TTS
  hasImages: boolean
  extractedAt: string
}

/**
 * Full book content with all transcribed pages
 */
export interface BookContent {
  bookId: string
  pages: PageContent[]
  totalPages: number
  status: TranscriptionStatus
}

/**
 * Transcription status enum
 */
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * Progress update during transcription
 */
export interface TranscriptionProgress {
  bookId: string
  currentPage: number
  totalPages: number
  status: TranscriptionStatus
  error?: string
}

/**
 * Options for the transcription process
 */
export interface TranscriptionOptions {
  extractImages?: boolean
  preserveLayout?: boolean
  onProgress?: (progress: TranscriptionProgress) => void
}
