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
  isLoading?: boolean
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
  isLoading = false,
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
          const aTime = a.lastRead?.getTime?.() ?? (a.last_read ? new Date(a.last_read).getTime() : 0)
          const bTime = b.lastRead?.getTime?.() ?? (b.last_read ? new Date(b.last_read).getTime() : 0)
          comparison = bTime - aTime
          break
        case "created_at":
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
      transition={{ duration: 0.5 }}
      className="w-full max-w-[1920px] mx-auto px-6 py-8"
    >
      {/* CSS GRID: Horizontal Row-First Population */}
      <div
        className="grid gap-x-6 gap-y-8"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        }}
      >
        {/* Upload Zone */}
        <UploadZone onAddBook={onAddBook} />

        {/* Loading Skeletons */}
        {isLoading && (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <BookCardSkeleton key={`skeleton-${i}`} index={i} />
            ))}
          </>
        )}

        {/* Book Cards */}
        {!isLoading && (
          <AnimatePresence mode="popLayout">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id ? `book-${book.id}` : `new-book-${Date.now()}`}
                book={book}
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
        )}
      </div>

      {/* Empty State */}
      {!isLoading && filteredBooks.length === 0 && !filter.search && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
          <p className="text-muted-foreground">Your library is empty. Upload your first book to get started!</p>
        </motion.div>
      )}

      {!isLoading && filteredBooks.length === 0 && filter.search && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-20 flex flex-col items-center justify-center text-center"
        >
          {/* Minimalist Book Illustration */}
          <div className="mb-6 relative">
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              className="text-muted-foreground/30"
            >
              <rect x="16" y="12" width="48" height="56" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M24 24H56M24 32H48M24 40H52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="40" cy="56" r="4" stroke="currentColor" strokeWidth="2" />
            </svg>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
            >
              <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">?</span>
            </motion.div>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No results found</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            No books match "<span className="font-medium text-foreground">{filter.search}</span>". Try a different search term.
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

function BookCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative aspect-[7/10] w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-zinc-800"
    >
      {/* Shimmer Effect */}
      <div className="absolute inset-0 z-10 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Skeleton Content Structure */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 opacity-50">
        <div className="h-4 w-3/4 rounded-md bg-slate-200 dark:bg-zinc-700" />
        <div className="h-3 w-1/2 rounded-md bg-slate-200 dark:bg-zinc-700" />
      </div>
    </motion.div>
  )
}
