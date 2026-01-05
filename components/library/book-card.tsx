"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import Image from "next/image"
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion"
import { Loader2, Sparkles, CheckCircle2, RotateCcw, Clock, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { BookControlBar } from "./book-control-bar"

interface BookCardProps {
  book: any
  onOpen: (book: any) => void
  onRate: (book: any, rating: number) => void
  onEdit: (book: any) => void
  onDelete: (book: any) => void
  onTranscribe?: (book: any) => void
  onPlayAudio?: (book: any) => void
  onAttachAudio?: (book: any) => void
}

const SPRING = { stiffness: 400, damping: 30, mass: 0.9 }
const MAX_TILT = 10
const AVG_WPM = 250 // Average words per minute
const WORDS_PER_PAGE = 300 // Estimated words per page

// Calculate estimated time remaining
function calculateTimeRemaining(totalPages: number, currentPage: number): string {
  const remainingPages = totalPages - currentPage
  if (remainingPages <= 0) return "0 min left"

  const totalWords = remainingPages * WORDS_PER_PAGE
  const minutes = Math.ceil(totalWords / AVG_WPM)

  if (minutes < 60) return `${minutes} min left`
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  return `${hours}h ${remainingMins}m left`
}

// Get progress color based on percentage (Zeigarnik Effect color psychology)
function getProgressColor(progress: number): { from: string; to: string; text: string } {
  if (progress >= 100) {
    return { from: "from-emerald-400", to: "to-emerald-500", text: "text-emerald-400" }
  }
  if (progress >= 80) {
    return { from: "from-green-400", to: "to-green-500", text: "text-green-400" }
  }
  if (progress >= 20) {
    return { from: "from-blue-400", to: "to-indigo-500", text: "text-blue-400" }
  }
  if (progress > 0) {
    return { from: "from-amber-400", to: "to-orange-500", text: "text-amber-400" }
  }
  return { from: "from-gray-400", to: "to-gray-500", text: "text-gray-400" }
}

// Get progress status label
function getProgressLabel(progress: number): string {
  if (progress >= 100) return "Completed"
  if (progress >= 80) return "Almost there!"
  if (progress >= 50) return "Halfway done"
  if (progress >= 20) return "Getting started"
  if (progress > 0) return "Just started"
  return "New"
}

export function BookCard({
  book,
  onOpen,
  onRate,
  onEdit,
  onDelete,
  onTranscribe,
  onPlayAudio,
}: BookCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [MAX_TILT, -MAX_TILT]), SPRING)
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-MAX_TILT, MAX_TILT]), SPRING)

  const coverUrl = book.coverUrl ?? book.cover_url ?? "/placeholder.svg"
  const isProcessing = book.transcription_status === "processing" || book.audio_processing_status === "processing"
  const hasAudio = !!book.audio_url || book.audio_processing_status === 'ready'
  const isTranscribed = book.transcription_status === 'completed' || book.is_transcribed

  // Smart Logic Calculation
  const { progress, timeRemaining, isCompleted, hasStarted } = useMemo(() => {
    const total = book.total_pages || 0
    const current = book.current_page || 0

    if (total === 0) return { progress: 0, timeRemaining: "", isCompleted: false, hasStarted: false }

    const pct = Math.min(100, Math.round((current / total) * 100))
    return {
      progress: pct,
      timeRemaining: calculateTimeRemaining(total, current),
      isCompleted: pct >= 100,
      hasStarted: pct > 0
    }
  }, [book.current_page, book.total_pages])

  const progressColors = getProgressColor(progress)
  const progressLabel = getProgressLabel(progress)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      mouseX.set((e.clientX - rect.left) / rect.width)
      mouseY.set((e.clientY - rect.top) / rect.height)
    },
    [mouseX, mouseY]
  )

  const handleMouseLeave = () => {
    setIsHovered(false)
    mouseX.set(0.5)
    mouseY.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      layoutId={`book-${book.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onOpen(book)}
      className="group relative cursor-pointer"
      style={{ perspective: 800 }}
    >
      {/* 3D Container */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          scale: isHovered ? 1.04 : 1,
        }}
        transition={{ type: "spring", ...SPRING }}
        className="relative w-full preserve-3d"
      >
        {/* Refined Glow Shadow */}
        <motion.div
          animate={{ opacity: isHovered ? 0.4 : 0.15, scale: isHovered ? 1.02 : 1 }}
          className={cn(
            "absolute inset-0 -z-10 rounded-xl blur-xl transition-colors duration-500",
            isCompleted ? "bg-amber-400/40" : "bg-orange-500/30"
          )}
        />

        {/* Book Cover Container */}
        <div className={cn(
          "relative aspect-[7/10] overflow-hidden rounded-lg shadow-2xl bg-zinc-900",
          isCompleted && "ring-1 ring-amber-500/50"
        )}>
          <Image
            src={coverUrl}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
            quality={90}
            className={cn(
              "object-cover transition-transform duration-500 will-change-transform",
              isHovered && "scale-105"
            )}
          />

          {/* Cinematic Overlay - Dynamic Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity duration-300 pointer-events-none" />

          {/* Spine Shadow Effect */}
          <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />

          {/* --- SMART STATUS BADGES (Top Left) --- */}
          <div className="absolute left-2 top-2 z-20 flex flex-col gap-1.5 pointer-events-none">
            {isTranscribed && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg"
              >
                <Sparkles className="h-3 w-3 text-amber-400" />
              </motion.div>
            )}
            {isProcessing && (
              <div className="flex h-6 w-6 animate-pulse items-center justify-center rounded-full bg-blue-500/80 text-white backdrop-blur-md">
                <Loader2 className="h-3 w-3 animate-spin" />
              </div>
            )}
          </div>

          {/* --- VERIFIED READ BADGE (Completed State) --- */}
          {isCompleted && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute right-2 top-2 z-20"
            >
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500 text-black font-semibold text-[10px] shadow-lg shadow-amber-500/20">
                <CheckCircle2 className="h-3 w-3" />
                <span>Verified Read</span>
              </div>
            </motion.div>
          )}

          {/* --- REFINED READING PROGRESS SYSTEM --- */}
          {hasStarted && !isCompleted && (
            <>
              {/* Smart Pill Status Badge (Anchored Bottom Left) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-3 bottom-4 z-20 pointer-events-none"
              >
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
                  {isHovered ? (
                    <>
                      <Clock className="h-3 w-3 text-orange-400" />
                      <span className="text-[10px] font-medium text-white/90">{timeRemaining}</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-3 w-3 text-white/70" />
                      <span className="text-[10px] font-medium text-white">{progress}%</span>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Liquid Linear Gradient Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 z-20">
                {/* Track */}
                <div className="relative h-1 w-full bg-gray-700/30 backdrop-blur-sm overflow-hidden group-hover:h-2 transition-all duration-300 ease-out">
                  {/* Fill - Using scaleX for GPU performance */}
                  <motion.div
                    className="absolute inset-y-0 left-0 w-full origin-left bg-gradient-to-r from-orange-500 to-amber-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: progress / 100 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  />

                  {/* Scrubber Glow (Visual Flair) */}
                  <motion.div
                    className="absolute top-0 bottom-0 w-4 bg-white/50 blur-sm"
                    style={{ left: `${progress}%` }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Metadata on Hover (Reduced interference with progress) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ type: "spring", ...SPRING }}
            className="absolute bottom-8 left-0 right-0 p-3 pointer-events-none"
          >
            <h3 className="font-serif text-sm font-semibold text-white line-clamp-2 drop-shadow-md mb-0.5">
              {book.title}
            </h3>
            <p className="text-[10px] text-white/80 truncate font-light tracking-wide">
              {book.author}
            </p>



            {/* Category Badges */}
            {book.genre && !hasStarted && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {book.genre.split(",").slice(0, 2).map((cat: string, i: number) => (
                  <span
                    key={i}
                    className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
                  >
                    {cat.trim()}
                  </span>
                ))}
                {book.genre.split(",").length > 2 && (
                  <span className="inline-block rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                    +{book.genre.split(",").length - 2}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Control Bar */}
        <BookControlBar
          isVisible={isHovered}
          onOpen={() => onOpen(book)}
          onPlay={hasAudio ? () => onPlayAudio?.(book) : undefined}
          onEdit={() => onEdit(book)}
          onDelete={() => onDelete(book)}
          hasAudio={hasAudio}
          isCompleted={isCompleted}
        />
      </motion.div>
    </motion.div>
  )
}

