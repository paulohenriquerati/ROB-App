"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { LibraryFilter } from "@/lib/types"
import { BookCard } from "./book-card"
import { UploadZone } from "./upload-zone"

interface BookGridProps {
  books: any[]
  filter: LibraryFilter
  onOpenBook: (book: any) => void
  onRateBook: (book: any, rating: number) => void
  onEditBook: (book: any) => void
  onDeleteBook: (book: any) => void
  onTranscribeBook?: (book: any) => void
  onPlayAudioBook?: (book: any) => void
  onAttachAudioBook?: (book: any) => void
  onAddBook: () => void
}

export function BookGrid({
  books,
  filter,
  onOpenBook,
  onRateBook,
  onEditBook,
  onDeleteBook,
  onTranscribeBook,
  onPlayAudioBook,
  onAttachAudioBook,
  onAddBook,
}: BookGridProps) {
  // Filter and sort books
  const filteredBooks = books
    .filter((book) => {
      if (!filter.search) return true
      const search = filter.search.toLowerCase()
      return book.title.toLowerCase().includes(search) || book.author.toLowerCase().includes(search)
    })
    .sort((a, b) => {
      let comparison = 0
      switch (filter.sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        case "rating":
          comparison = b.rating - a.rating
          break
        case "last_read":
        case "lastRead":
          const aTime = a.lastRead?.getTime?.() ?? (a.last_read ? new Date(a.last_read).getTime() : 0)
          const bTime = b.lastRead?.getTime?.() ?? (b.last_read ? new Date(b.last_read).getTime() : 0)
          comparison = bTime - aTime
          break
        case "created_at":
        case "createdAt":
          const aCreated = a.createdAt?.getTime?.() ?? (a.created_at ? new Date(a.created_at).getTime() : 0)
          const bCreated = b.createdAt?.getTime?.() ?? (b.created_at ? new Date(b.created_at).getTime() : 0)
          comparison = bCreated - aCreated
          break
      }
      return filter.sortOrder === "asc" ? -comparison : comparison
    })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    >
      {/* Upload Zone */}
      <UploadZone onAddBook={onAddBook} />

      {/* Book Cards */}
      <AnimatePresence mode="popLayout">
        {filteredBooks.map((book, index) => (
          <BookCard
            key={book.id ? `book-${book.id}` : `new-book-${index}-${Date.now()}`}
            book={book}
            index={index}
            onOpen={onOpenBook}
            onRate={onRateBook}
            onEdit={onEditBook}
            onDelete={onDeleteBook}
            onTranscribe={onTranscribeBook}
            onPlayAudio={onPlayAudioBook}
            onAttachAudio={onAttachAudioBook}
          />
        ))}
      </AnimatePresence>

      {/* Empty State */}
      {filteredBooks.length === 0 && !filter.search && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 text-center">
          <p className="text-muted-foreground">Your library is empty. Upload your first book to get started!</p>
        </motion.div>
      )}

      {filteredBooks.length === 0 && filter.search && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 text-center">
          <p className="text-muted-foreground">No books match your search.</p>
        </motion.div>
      )}
    </motion.div>
  )
}
