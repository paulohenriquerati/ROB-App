"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { LibraryFilter, BookCategory } from "@/lib/types"
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

// Category mapping for flexible genre matching
const CATEGORY_MAPPING: Record<Exclude<BookCategory, "all">, string[]> = {
  technical: ["technical", "dev", "programming", "software", "engineering", "computer", "code", "development"],
  philosophy: ["philosophy", "philosophical", "ethics", "metaphysics", "epistemology"],
  history: ["history", "historical", "ancient", "medieval", "modern history"],
  "sci-fi": ["sci-fi", "science fiction", "scifi", "sf", "futuristic", "dystopia", "space"],
  biography: ["biography", "biographical", "memoir", "autobiography", "life story"],
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
  // Memoized category filtering
  const filteredByCategory = useMemo(() => {
    if (filter.category === "all") return books

    const keywords = CATEGORY_MAPPING[filter.category] || []
    return books.filter((book) => {
      const genre = (book.genre || "").toLowerCase()
      const title = (book.title || "").toLowerCase()
      return keywords.some((keyword) => genre.includes(keyword) || title.includes(keyword))
    })
  }, [books, filter.category])

  // Filter by search and sort
  const filteredBooks = useMemo(() => {
    return filteredByCategory
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
  }, [filteredByCategory, filter.search, filter.sortBy, filter.sortOrder])

  // Staggered animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.2 }
    },
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-[1920px] mx-auto px-6 py-8"
    >
      {/* CSS GRID: Horizontal Row-First Population */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
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

        {/* Book Cards with Staggered Animation */}
        {!isLoading && (
          <AnimatePresence mode="popLayout">
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id ? `book-${book.id}` : `new-book-${Date.now()}`}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                layout
                layoutId={`book-container-${book.id}`}
              >
                <BookCard
                  book={book}
                  onOpen={onOpenBook}
                  onRate={onRateBook}
                  onEdit={onEditBook}
                  onDelete={onDeleteBook}
                  onTranscribe={onTranscribeBook}
                  onPlayAudio={onPlayAudioBook}
                  onAttachAudio={onAttachAudioBook}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Empty State - No books in library */}
      {!isLoading && filteredBooks.length === 0 && !filter.search && filter.category === "all" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
          <p className="text-muted-foreground">Your library is empty. Upload your first book to get started!</p>
        </motion.div>
      )}

      {/* Empty State - No matching category */}
      {!isLoading && filteredBooks.length === 0 && filter.category !== "all" && !filter.search && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-20 flex flex-col items-center justify-center text-center"
        >
          {/* Minimalist Category Illustration */}
          <div className="mb-6 relative">
            <svg
              width="100"
              height="100"
              viewBox="0 0 100 100"
              fill="none"
              className="text-muted-foreground/20"
            >
              {/* Stack of Books */}
              <rect x="20" y="55" width="60" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
              <rect x="25" y="43" width="50" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
              <rect x="22" y="31" width="56" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
              {/* Magnifying Glass */}
              <circle cx="65" cy="25" r="12" stroke="currentColor" strokeWidth="2" />
              <path d="M74 34L82 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 15 }}
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
            >
              <span className="text-amber-600 dark:text-amber-400 text-sm font-bold">0</span>
            </motion.div>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No books in this category</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            You don't have any{" "}
            <span className="font-medium text-foreground capitalize">
              {filter.category.replace("-", " ")}
            </span>{" "}
            books yet. Add some or browse a different category.
          </p>
        </motion.div>
      )}

      {/* Empty State - Search with no results */}
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

