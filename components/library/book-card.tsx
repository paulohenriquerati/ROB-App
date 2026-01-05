"use client"

import { useState, useCallback, useRef } from "react"
import Image from "next/image"
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion"
import { Loader2, Sparkles } from "lucide-react"
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
        {/* Glow Shadow */}
        <motion.div
          animate={{ opacity: isHovered ? 0.4 : 0.15, scale: isHovered ? 1.02 : 1 }}
          className="absolute inset-0 -z-10 rounded-xl bg-amber-500/30 blur-xl"
        />

        {/* Book Cover - ASPECT RATIO 7:10 (Standard Book) */}
        <div className="relative aspect-[7/10] overflow-hidden rounded-lg shadow-lg bg-zinc-100">
          <Image
            src={coverUrl}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
            quality={90}
            className={cn(
              "object-cover transition-transform duration-500",
              isHovered && "scale-105"
            )}
          />

          {/* Spine Shadow */}
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />

          {/* Status Badges */}
          <div className="absolute left-2 top-2 z-20 flex flex-col gap-1.5">
            {isTranscribed && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/90 text-amber-900 shadow-lg backdrop-blur-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </motion.div>
            )}
            {isProcessing && (
              <div className="flex h-7 w-7 animate-pulse items-center justify-center rounded-full bg-blue-500/90 text-white shadow-lg backdrop-blur-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </div>
            )}
          </div>

          {/* Hover Gradient Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"
          />

          {/* Metadata on Hover */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ type: "spring", ...SPRING }}
            className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none"
          >
            <h3 className="font-serif text-sm font-semibold text-white line-clamp-2 drop-shadow-md">
              {book.title}
            </h3>
            <p className="mt-0.5 text-xs text-white/80 truncate">
              {book.author}
            </p>
            {/* Category Badges */}
            {book.genre && (
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
        />
      </motion.div>
    </motion.div>
  )
}
