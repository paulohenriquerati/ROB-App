"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion, LayoutGroup } from "framer-motion"
import type { Book, LibraryFilter } from "@/lib/types"
import { LibraryHeader } from "./header"
import { SearchFilter } from "./search-filter"
import { BookGrid } from "./book-grid"
import { BookReader } from "../reader/book-reader"
import { BookIntroduction } from "./book-introduction"
import { EditBookModal } from "./edit-book-modal"
import { AddBookModal } from "./add-book-modal"
import { AttachAudioModal } from "./attach-audio-modal"
import { TranscriptionModal } from "./transcription-modal"
import { StatsDashboard } from "../stats/stats-dashboard"
import { CommunityFeed } from "../social/community-feed"
import { AudiobookPlayer, type AudiobookTheme } from "../reader/audiobook-player"
import { useBooks } from "@/lib/hooks/use-books"
import { useAuth } from "@/lib/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { extractPdfInfo } from "@/lib/pdf-utils"
import { uploadAudioFile, uploadAudioCover } from "@/lib/audio-storage"
import type { AudioMetadata } from "@/lib/audio-utils"

const defaultFilter: LibraryFilter = {
  search: "",
  sortBy: "last_read",
  sortOrder: "desc",
  category: "all",
}

export function LibraryView() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { books, isLoading: booksLoading, mutate } = useBooks()
  const [filter, setFilter] = useState<LibraryFilter>(defaultFilter)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [introductionBook, setIntroductionBook] = useState<Book | null>(null)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isAddBookOpen, setIsAddBookOpen] = useState(false)
  const [activeView, setActiveView] = useState<"library" | "stats" | "community">("library")
  const [transcribingBook, setTranscribingBook] = useState<Book | null>(null)

  // Audiobook Player State
  const [audioBook, setAudioBook] = useState<Book | null>(null)
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false)
  const [isAudioPlayerMinimized, setIsAudioPlayerMinimized] = useState(false)
  const [audioPlayerTheme, setAudioPlayerTheme] = useState<AudiobookTheme>("cream")

  // Attach Audio Modal State
  const [attachAudioBook, setAttachAudioBook] = useState<Book | null>(null)

  // Navigate to the new O'Reilly-style book details page
  const handleOpenBook = useCallback((book: Book) => {
    router.push(`/book/${book.id}`)
  }, [router])

  // Start reading from introduction page
  const handleStartReading = useCallback(() => {
    if (introductionBook) {
      setSelectedBook(introductionBook)
      setIntroductionBook(null)
    }
  }, [introductionBook])

  // Close introduction and return to library
  const handleCloseIntroduction = useCallback(() => {
    setIntroductionBook(null)
  }, [])

  const handleCloseReader = useCallback(() => {
    setSelectedBook(null)
    mutate() // Refresh books after reading
  }, [mutate])

  // Audiobook Player Handlers
  const handlePlayAudio = useCallback((book: Book) => {
    setAudioBook(book)
    setIsAudioPlayerOpen(true)
    setIsAudioPlayerMinimized(false)
  }, [])

  const handleCloseAudioPlayer = useCallback(() => {
    setIsAudioPlayerOpen(false)
    setIsAudioPlayerMinimized(false)
    setAudioBook(null)
  }, [])

  const handleMinimizeAudioPlayer = useCallback(() => {
    setIsAudioPlayerMinimized(true)
  }, [])

  const handleMaximizeAudioPlayer = useCallback(() => {
    setIsAudioPlayerMinimized(false)
  }, [])

  // Save audio progress to database
  const handleSaveAudioProgress = useCallback(async (bookId: string, position: number) => {
    const supabase = createClient()
    await supabase.from("books").update({
      last_played_position: position,
    }).eq("id", bookId)
  }, [])

  // Attach Audio Handlers
  const handleAttachAudio = useCallback((book: Book) => {
    setAttachAudioBook(book)
  }, [])

  const handleAttachAudioFile = useCallback(async (
    book: Book,
    audioUrl: string,
    duration: number,
    coverUrl?: string
  ) => {
    const supabase = createClient()
    const updates: any = {
      is_audiobook: true,
      audio_source_type: 'file',
      audio_url: audioUrl,
      audio_duration: duration,
    }
    if (coverUrl) {
      updates.cover_url = coverUrl
    }
    await supabase.from("books").update(updates).eq("id", book.id)
    mutate()
    setAttachAudioBook(null)
  }, [mutate])

  const handleAttachAudioLink = useCallback(async (
    book: Book,
    audioUrl: string,
    duration: number
  ) => {
    const supabase = createClient()
    await supabase.from("books").update({
      is_audiobook: true,
      audio_source_type: 'link',
      audio_url: audioUrl,
      audio_duration: duration,
    }).eq("id", book.id)
    mutate()
    setAttachAudioBook(null)
  }, [mutate])

  // Add Audiobook Handler
  const handleAddAudiobook = useCallback(async (metadata: AudioMetadata, file: File) => {
    if (!user) return

    const supabase = createClient()
    const isAax = file.name.toLowerCase().endsWith('.aax')

    // Upload audio file directly to Supabase Storage
    // This works for all audio types including AAX
    const audioUrl = await uploadAudioFile(file, user.id)
    if (!audioUrl) throw new Error("Failed to upload audio file")

    // Upload cover if available
    let coverUrl = '/placeholder.jpg'
    if (metadata.coverBlob) {
      const uploadedCover = await uploadAudioCover(metadata.coverBlob, user.id, metadata.title)
      if (uploadedCover) coverUrl = uploadedCover
    }

    // Create book record
    // Note: AAX files are stored as-is. For web playback, FFmpeg conversion
    // would need to happen on a self-hosted server with FFmpeg installed.
    await supabase.from("books").insert({
      title: metadata.title || file.name.replace(/\.(aax|mp3|m4b|wav)$/i, ''),
      author: metadata.author || 'Unknown Author',
      cover_url: coverUrl,
      user_id: user.id,
      is_audiobook: true,
      audio_source_type: 'file',
      audio_url: audioUrl,
      audio_duration: metadata.duration,
      audio_processing_status: isAax ? 'processing' : 'ready', // AAX needs conversion for playback
      audio_original_filename: isAax ? file.name : undefined,
      total_pages: 0,
    })

    mutate()
  }, [user, mutate])

  const handleAddExternalAudio = useCallback(async (
    url: string,
    title: string,
    author: string,
    duration: number
  ) => {
    if (!user) return

    const supabase = createClient()
    await supabase.from("books").insert({
      title,
      author,
      cover_url: '/placeholder.jpg',
      user_id: user.id,
      is_audiobook: true,
      audio_source_type: 'link',
      audio_url: url,
      audio_duration: duration,
      total_pages: 0,
    })

    mutate()
  }, [user, mutate])

  const handleRateBook = useCallback(
    async (book: Book, rating: number) => {
      const supabase = createClient()
      await supabase.from("books").update({ rating }).eq("id", book.id)
      mutate()
    },
    [mutate],
  )

  const handleEditBook = useCallback((book: Book) => {
    setEditingBook(book)
  }, [])

  const handleSaveBook = useCallback(
    async (updatedBook: Book) => {
      const supabase = createClient()
      await supabase
        .from("books")
        .update({
          title: updatedBook.title,
          author: updatedBook.author,
          genre: updatedBook.genre,
          description: updatedBook.description,
        })
        .eq("id", updatedBook.id)
      setEditingBook(null)
      mutate()
    },
    [mutate],
  )

  const handleDeleteBook = useCallback(
    async (book: Book) => {
      const supabase = createClient()
      await supabase.from("books").delete().eq("id", book.id)
      mutate()
    },
    [mutate],
  )

  const handleTranscribeBook = useCallback((book: Book) => {
    setTranscribingBook(book)
  }, [])

  const handleTranscriptionComplete = useCallback(() => {
    setTranscribingBook(null)
    mutate() // Refresh books to update transcription status
  }, [mutate])

  const handleUpload = useCallback(
    async (files: FileList) => {
      if (!user) return

      setIsUploading(true)
      const supabase = createClient()

      try {
        for (const file of Array.from(files)) {
          // Extract cover image and metadata from PDF
          const pdfInfo = await extractPdfInfo(file)

          // Upload PDF to Supabase Storage for persistent storage
          const { uploadPdfToStorage } = await import("@/lib/pdf-storage")
          const pdfUrl = await uploadPdfToStorage(file, user.id)

          if (!pdfUrl) {
            console.error("Failed to upload PDF to storage")
            continue
          }

          await supabase.from("books").insert({
            title: pdfInfo.title,
            author: pdfInfo.author,
            cover_url: pdfInfo.coverUrl,
            total_pages: pdfInfo.pageCount,
            pdf_url: pdfUrl,
            user_id: user.id,
          })
        }
        mutate()
      } catch (error) {
        console.error("Error uploading books:", error)
      } finally {
        setIsUploading(false)
      }
    },
    [user, mutate],
  )

  const handlePageChange = useCallback(async (bookId: string, page: number) => {
    const supabase = createClient()
    await supabase
      .from("books")
      .update({
        current_page: page,
        last_read: new Date().toISOString(),
      })
      .eq("id", bookId)
  }, [])

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Convert database books to component format
  const formattedBooks = books.map((book) => ({
    ...book,
    coverUrl: book.cover_url,
    totalPages: book.total_pages,
    currentPage: book.current_page,
    lastRead: book.last_read ? new Date(book.last_read) : null,
    createdAt: new Date(book.created_at),
    pdfUrl: book.pdf_url,
  }))

  return (
    <div className="min-h-screen bg-background">
      <LibraryHeader
        activeView={activeView}
        onViewChange={setActiveView}
        searchQuery={filter.search}
        onSearch={(query) => setFilter(prev => ({ ...prev, search: query }))}
      />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <AnimatePresence mode="wait">
          {activeView === "library" && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SearchFilter filter={filter} onFilterChange={setFilter} totalBooks={books.length} />
              <div className="mt-8">
                <BookGrid
                  books={formattedBooks as any}
                  filter={filter as any}
                  onOpenBook={handleOpenBook as any}
                  onRateBook={handleRateBook as any}
                  onEditBook={handleEditBook as any}
                  onDeleteBook={handleDeleteBook as any}
                  onTranscribeBook={handleTranscribeBook as any}
                  onPlayAudioBook={handlePlayAudio as any}
                  onAttachAudioBook={handleAttachAudio as any}
                  onAddBook={() => setIsAddBookOpen(true)}
                  isLoading={booksLoading}
                />
              </div>
            </motion.div>
          )}

          {activeView === "stats" && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h1 className="font-serif text-2xl font-medium">Your Reading Journey</h1>
                <p className="mt-1 text-muted-foreground">Track your progress and celebrate your achievements</p>
              </div>
              <StatsDashboard />
            </motion.div>
          )}

          {activeView === "community" && (
            <motion.div
              key="community"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h1 className="font-serif text-2xl font-medium">Community</h1>
                <p className="mt-1 text-muted-foreground">Discover quotes, reviews, and what others are reading</p>
              </div>
              <CommunityFeed />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Book Modal */}
      <AnimatePresence>
        {isAddBookOpen && (
          <AddBookModal
            isOpen={isAddBookOpen}
            onClose={() => setIsAddBookOpen(false)}
            onUpload={handleUpload}
            onAddAudiobook={handleAddAudiobook}
            onAddExternalAudio={handleAddExternalAudio}
          />
        )}
      </AnimatePresence>

      {/* Book Introduction Page */}
      <AnimatePresence>
        {introductionBook && (
          <BookIntroduction
            book={introductionBook}
            onStartReading={handleStartReading}
            onClose={handleCloseIntroduction}
            allBooks={books}
          />
        )}
      </AnimatePresence>

      {/* Book Reader Modal */}
      <AnimatePresence>
        {selectedBook && (
          <BookReader
            book={selectedBook as any}
            onClose={handleCloseReader}
            onPageChange={(page) => handlePageChange(selectedBook.id, page)}
          />
        )}
      </AnimatePresence>

      {/* Edit Book Modal */}
      <AnimatePresence>
        {editingBook && (
          <EditBookModal
            book={editingBook as any}
            onSave={handleSaveBook as any}
            onClose={() => setEditingBook(null)}
          />
        )}
      </AnimatePresence>

      {/* Transcription Modal */}
      {transcribingBook && (
        <TranscriptionModal
          book={transcribingBook}
          isOpen={!!transcribingBook}
          onClose={() => setTranscribingBook(null)}
          onComplete={handleTranscriptionComplete}
        />
      )}

      {/* Audiobook Player */}
      <LayoutGroup>
        <AnimatePresence>
          {isAudioPlayerOpen && audioBook && (
            <AudiobookPlayer
              isOpen={isAudioPlayerOpen}
              isMinimized={isAudioPlayerMinimized}
              onClose={handleCloseAudioPlayer}
              onMinimize={handleMinimizeAudioPlayer}
              onMaximize={handleMaximizeAudioPlayer}
              book={{
                id: audioBook.id,
                title: audioBook.title,
                author: audioBook.author,
                coverUrl: audioBook.cover_url,
                audioUrl: audioBook.audio_url,
                duration: audioBook.audio_duration,
                lastPosition: audioBook.last_played_position,
              }}
              theme={audioPlayerTheme}
              onThemeChange={setAudioPlayerTheme}
              onProgressSave={handleSaveAudioProgress}
            />
          )}
        </AnimatePresence>
      </LayoutGroup>

      {/* Attach Audio Modal */}
      <AttachAudioModal
        isOpen={!!attachAudioBook}
        onClose={() => setAttachAudioBook(null)}
        book={attachAudioBook}
        onAttachFile={handleAttachAudioFile}
        onAttachLink={handleAttachAudioLink}
      />
    </div>
  )
}
