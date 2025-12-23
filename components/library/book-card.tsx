"use client"

import { motion } from "framer-motion"
import { Star, MoreVertical, Sparkles, FileText, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface BookCardProps {
  book: any
  index: number
  onOpen: (book: any) => void
  onRate: (book: any, rating: number) => void
  onEdit: (book: any) => void
  onDelete: (book: any) => void
  onTranscribe?: (book: any) => void
}

export function BookCard({ book, index, onOpen, onRate, onEdit, onDelete, onTranscribe }: BookCardProps) {
  const totalPages = book.totalPages ?? book.total_pages ?? 100
  const currentPage = book.currentPage ?? book.current_page ?? 0
  const coverUrl = book.coverUrl ?? book.cover_url ?? "/open-book-library.png"
  const lastRead = book.lastRead ?? (book.last_read ? new Date(book.last_read) : null)
  const transcriptionStatus = book.transcription_status ?? "pending"

  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0
  const isTranscribed = transcriptionStatus === "completed"
  const isTranscribing = transcriptionStatus === "processing"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <div
        onClick={() => onOpen(book)}
        className="relative cursor-pointer overflow-hidden rounded-lg bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-foreground/5"
      >
        {/* Book Cover */}
        <div className="relative aspect-[7/10] overflow-hidden">
          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full"
          >
            <img src={coverUrl || "/placeholder.svg"} alt={book.title} className="h-full w-full object-cover" />
          </motion.div>

          {/* Progress Overlay */}
          {progress > 0 && progress < 100 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, delay: index * 0.05 + 0.3 }}
                className="h-full bg-accent"
              />
            </div>
          )}

          {/* Transcription Badge */}
          {isTranscribed && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
              <Sparkles className="h-3 w-3" />
              Enhanced
            </div>
          )}

          {/* Transcribing Badge */}
          {isTranscribing && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-blue-500 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing
            </div>
          )}

          {/* Completed Badge */}
          {progress === 100 && (
            <div className="absolute right-2 top-2 rounded bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              Completed
            </div>
          )}

          {/* Hover Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-foreground/60 backdrop-blur-sm"
          >
            <span className="rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground">Open Book</span>
          </motion.div>
        </div>

        {/* Book Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-serif text-base font-medium leading-tight">{book.title}</h3>
              <p className="mt-1 truncate text-sm text-muted-foreground">{book.author}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Transcription option */}
                {onTranscribe && !isTranscribed && !isTranscribing && book.pdf_url && (
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onTranscribe(book); }}
                    className="text-amber-600 dark:text-amber-400"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Enhance with AI
                  </DropdownMenuItem>
                )}
                {isTranscribed && (
                  <DropdownMenuItem disabled className="text-green-600 dark:text-green-400">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Already Enhanced
                  </DropdownMenuItem>
                )}
                {isTranscribing && (
                  <DropdownMenuItem disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(book); }}>Edit Details</DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(book); }} className="text-destructive">
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Rating */}
          <div className="mt-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onRate(book, star)
                }}
                className="relative p-0.5 focus:outline-none"
              >
                <Star
                  className={`h-3.5 w-3.5 transition-colors duration-300 ${star <= book.rating
                    ? "fill-amber-500 text-amber-500"
                    : "fill-transparent text-slate-300 dark:text-zinc-600"
                    }`}
                />
              </motion.button>
            ))}
            {lastRead && <span className="ml-auto text-xs text-muted-foreground">{formatLastRead(lastRead)}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function formatLastRead(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - dateObj.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}
