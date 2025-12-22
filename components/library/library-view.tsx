"use client"

import { useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import type { Book, LibraryFilter } from "@/lib/types"
import { LibraryHeader } from "./header"
import { SearchFilter } from "./search-filter"
import { BookGrid } from "./book-grid"
import { BookReader } from "../reader/book-reader"
import { EditBookModal } from "./edit-book-modal"
import { AddBookModal } from "./add-book-modal"
import { StatsDashboard } from "../stats/stats-dashboard"
import { CommunityFeed } from "../social/community-feed"
import { useBooks } from "@/lib/hooks/use-books"
import { useAuth } from "@/lib/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { extractPdfInfo } from "@/lib/pdf-utils"

const defaultFilter: LibraryFilter = {
  search: "",
  sortBy: "last_read",
  sortOrder: "desc",
}

export function LibraryView() {
  const { user, isLoading: authLoading } = useAuth()
  const { books, isLoading: booksLoading, mutate } = useBooks()
  const [filter, setFilter] = useState<LibraryFilter>(defaultFilter)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isAddBookOpen, setIsAddBookOpen] = useState(false)
  const [activeView, setActiveView] = useState<"library" | "stats" | "community">("library")

  const handleOpenBook = useCallback((book: Book) => {
    setSelectedBook(book)
  }, [])

  const handleCloseReader = useCallback(() => {
    setSelectedBook(null)
    mutate() // Refresh books after reading
  }, [mutate])

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
      <LibraryHeader activeView={activeView} onViewChange={setActiveView} />

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
                {booksLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <BookGrid
                    books={formattedBooks as any}
                    filter={filter as any}
                    onOpenBook={handleOpenBook as any}
                    onRateBook={handleRateBook as any}
                    onEditBook={handleEditBook as any}
                    onDeleteBook={handleDeleteBook as any}

                    onAddBook={() => setIsAddBookOpen(true)}
                  />
                )}
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
    </div>
  )
}
