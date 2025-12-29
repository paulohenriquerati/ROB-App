"use client"

import { useState, useCallback } from "react"
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  type Variants,
} from "framer-motion"
import { Star, MoreVertical, Sparkles, FileText, Loader2, BookOpen, Bookmark, Share2, Headphones } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface BookCardProps {
  book: any
  index: number
  onOpen: (book: any) => void
  onRate: (book: any, rating: number) => void
  onEdit: (book: any) => void
  onDelete: (book: any) => void
  onTranscribe?: (book: any) => void
  onPlayAudio?: (book: any) => void
  onAttachAudio?: (book: any) => void
}

// ═══════════════════════════════════════════════════════════════════
// ANIMATION PHYSICS EXPLAINED
// ═══════════════════════════════════════════════════════════════════
//
// Spring Configuration for "Toon" Weight:
// 
// 🎯 STIFFNESS (400-500): High stiffness = snappy, immediate response
//    → Creates that "bouncy cartoon" feel where objects react quickly
//    → Too low = mushy/floaty (kills the toon vibe)
//    → Too high = robotic/mechanical
//
// 🎯 DAMPING (25-35): Moderate damping = controlled bounce
//    → Prevents endless wobbling while keeping some "juice"
//    → Lower = more oscillation (too cartoony/springy)
//    → Higher = more dampened (too realistic/boring)
//
// 🎯 MASS (0.8-1.2): Object weight perception
//    → Lower mass = lighter, quicker animations
//    → Higher mass = heavier, more deliberate movements
//
// The combination creates "tactile weight" - the UI element feels like
// it has physical presence without being sluggish.
// ═══════════════════════════════════════════════════════════════════

// Spring configs for different interaction types
const springConfig = {
  // Primary slide animation - snappy with minimal overshoot
  slide: { stiffness: 450, damping: 30, mass: 0.9 },
  // Scale bounce - quick pop with slight overshoot
  bounce: { stiffness: 500, damping: 28, mass: 0.8 },
  // Tilt effect - responsive but smooth
  tilt: { stiffness: 400, damping: 35, mass: 1.0 },
}

// Variants for the spine/action layer reveal
const spineVariants: Variants = {
  hidden: {
    x: "-100%",
    opacity: 0,
  },
  visible: {
    x: "0%",
    opacity: 1,
  },
}

// Variants for action buttons stagger
const actionButtonVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      ...springConfig.bounce,
      delay: i * 0.05, // Staggered entrance
    },
  }),
}

export function BookCard({
  book,
  index,
  onOpen,
  onRate,
  onEdit,
  onDelete,
  onTranscribe,
  onPlayAudio,
  onAttachAudio,
}: BookCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Motion values for performance optimization
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Spring-animated values for smooth micro-interactions
  const springX = useSpring(x, springConfig.tilt)
  const springY = useSpring(y, springConfig.tilt)

  // Transform mouse position to subtle tilt
  const rotateX = useTransform(springY, [-0.5, 0.5], [3, -3])
  const rotateY = useTransform(springX, [-0.5, 0.5], [-3, 3])

  // Book data normalization
  const totalPages = book.totalPages ?? book.total_pages ?? 100
  const currentPage = book.currentPage ?? book.current_page ?? 0
  const coverUrl = book.coverUrl ?? book.cover_url ?? "/open-book-library.png"
  const lastRead = book.lastRead ?? (book.last_read ? new Date(book.last_read) : null)
  const transcriptionStatus = book.transcription_status ?? "pending"

  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0
  const isTranscribed = transcriptionStatus === "completed"
  const isTranscribing = transcriptionStatus === "processing"

  // Handle mouse move for 3D tilt effect
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      x.set((event.clientX - centerX) / rect.width)
      y.set((event.clientY - centerY) / rect.height)
    },
    [x, y]
  )

  // Reset tilt on mouse leave
  const handleMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
    setIsHovered(false)
  }, [x, y])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1], // Custom cubic-bezier for smooth entry
      }}
      className="group relative perspective-1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* 3D Container with tilt effect */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative"
      >
        {/* ═══════════════════════════════════════════════════════════════════
            SPINE/ACTION LAYER - Reveals on hover, slides from left
            ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          variants={spineVariants}
          initial="hidden"
          animate={isHovered ? "visible" : "hidden"}
          transition={{
            type: "spring",
            ...springConfig.slide,
          }}
          className="absolute -left-1 top-0 bottom-0 z-10 flex w-12 flex-col items-center justify-center gap-3 rounded-l-lg bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 shadow-lg"
          style={{ transformOrigin: "right center" }}
        >
          {/* Quick Action Buttons */}
          {[
            { icon: BookOpen, label: "Read", action: () => onOpen(book) },
            { icon: Bookmark, label: "Bookmark", action: () => { } },
            { icon: Share2, label: "Share", action: () => { } },
          ].map((item, i) => (
            <motion.button
              key={item.label}
              custom={i}
              variants={actionButtonVariants}
              initial="hidden"
              animate={isHovered ? "visible" : "hidden"}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation()
                item.action()
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              title={item.label}
            >
              <item.icon className="h-4 w-4" />
            </motion.button>
          ))}
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            MAIN CARD - Slides right on hover to reveal spine
            ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          animate={{
            x: isHovered ? 44 : 0, // Slide right amount
            scale: isHovered ? 1.02 : 1, // Subtle scale bounce
            rotateZ: isHovered ? 1 : 0, // Micro tilt for playfulness
          }}
          transition={{
            type: "spring",
            ...springConfig.slide,
          }}
          onClick={() => onOpen(book)}
          className="relative cursor-pointer overflow-hidden rounded-lg bg-card shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-foreground/10"
        >
          {/* Book Cover */}
          <div className="relative aspect-[7/10] overflow-hidden">
            <motion.div
              animate={{
                scale: isHovered ? 1.05 : 1,
              }}
              transition={{
                type: "spring",
                ...springConfig.bounce,
              }}
              className="h-full w-full"
            >
              <img
                src={coverUrl || "/placeholder.svg"}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            </motion.div>

            {/* Progress Overlay with animated glow */}
            {progress > 0 && progress < 100 && (
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-muted/50 backdrop-blur-sm">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.05 + 0.3,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative h-full bg-gradient-to-r from-amber-400 to-orange-500"
                >
                  {/* Animated glow effect */}
                  <motion.div
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      scale: [1, 1.5, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-amber-300 blur-sm"
                  />
                </motion.div>
              </div>
            )}

            {/* Transcription Badge with bounce animation */}
            {isTranscribed && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", ...springConfig.bounce }}
                className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-xs font-medium text-white shadow-lg"
              >
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-3 w-3" />
                </motion.span>
                Enhanced
              </motion.div>
            )}

            {/* Transcribing Badge */}
            {isTranscribing && (
              <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-blue-500 px-2.5 py-1 text-xs font-medium text-white shadow-lg">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing
              </div>
            )}

            {/* Audio Processing Badge (AAX Conversion) */}
            {(book.audio_processing_status === 'uploading' || book.audio_processing_status === 'processing') && (
              <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-medium text-white shadow-lg">
                <Loader2 className="h-3 w-3 animate-spin" />
                {book.audio_processing_status === 'uploading' ? 'Uploading...' : 'Optimizing...'}
              </div>
            )}

            {/* Completed Badge with pop animation */}
            {progress === 100 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", ...springConfig.bounce }}
                className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white shadow-lg"
              >
                ✓ Done
              </motion.div>
            )}

            {/* Hover Gradient Overlay with Play Audio Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
            >
              {/* Play Audio Button - Center (only when not processing) */}
              {onPlayAudio && (!book.audio_processing_status || book.audio_processing_status === 'ready') && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: isHovered ? 1 : 0,
                    opacity: isHovered ? 1 : 0,
                  }}
                  transition={{ type: "spring", ...springConfig.bounce, delay: 0.1 }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onPlayAudio(book)
                  }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-xl backdrop-blur-sm transition-colors hover:bg-white"
                  aria-label="Play audiobook"
                >
                  <Headphones className="h-6 w-6 text-amber-600" />
                </motion.button>
              )}

              {/* Read Label - Bottom */}
              <motion.span
                initial={{ y: 20, opacity: 0 }}
                animate={{
                  y: isHovered ? 0 : 20,
                  opacity: isHovered ? 1 : 0,
                }}
                transition={{ type: "spring", ...springConfig.slide }}
                className="absolute bottom-3 left-3 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md"
              >
                Click to read →
              </motion.span>
            </motion.div>
          </div>

          {/* Book Info */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-serif text-base font-medium leading-tight">
                  {book.title}
                </h3>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {book.author}
                </p>
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
                      onClick={(e) => {
                        e.stopPropagation()
                        onTranscribe(book)
                      }}
                      className="text-amber-600 dark:text-amber-400"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Enhance with AI
                    </DropdownMenuItem>
                  )}
                  {isTranscribed && (
                    <DropdownMenuItem
                      disabled
                      className="text-green-600 dark:text-green-400"
                    >
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
                  {/* Attach Audio option */}
                  {onAttachAudio && !book.audio_url && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onAttachAudio(book)
                      }}
                    >
                      <Headphones className="mr-2 h-4 w-4" />
                      Attach Audio
                    </DropdownMenuItem>
                  )}
                  {book.audio_url && (
                    <DropdownMenuItem disabled className="text-green-600 dark:text-green-400">
                      <Headphones className="mr-2 h-4 w-4" />
                      Audio Attached
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(book)
                    }}
                  >
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(book)
                    }}
                    className="text-destructive"
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Rating with juicy micro-interactions */}
            <div className="mt-3 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{
                    scale: 1.3,
                    rotate: [0, -10, 10, 0],
                    transition: { duration: 0.3 },
                  }}
                  whileTap={{
                    scale: 0.8,
                    transition: { type: "spring", ...springConfig.bounce },
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onRate(book, star)
                  }}
                  className="relative p-0.5 focus:outline-none"
                >
                  <Star
                    className={`h-4 w-4 transition-all duration-300 ${star <= book.rating
                      ? "fill-amber-500 text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]"
                      : "fill-transparent text-slate-300 dark:text-zinc-600"
                      }`}
                  />
                </motion.button>
              ))}
              {lastRead && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatLastRead(lastRead)}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
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
