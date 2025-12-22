"use client"

import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion"
import { useState, useCallback, useRef } from "react"
import type { ReaderSettings } from "@/lib/types"
import { PdfPage } from "./pdf-page"

interface Page {
  number: number
  content: string
  isChapterStart?: boolean
  chapterTitle?: string
}

interface PageTurn3DProps {
  pages: Page[]
  currentSpread: number
  onSpreadChange: (spread: number) => void
  settings: ReaderSettings
  totalPages: number
  bookTitle: string
  bookAuthor: string
  pdfUrl?: string
}

export function PageTurn3D({
  pages,
  currentSpread,
  onSpreadChange,
  settings,
  totalPages,
  bookTitle,
  bookAuthor,
  pdfUrl,
}: PageTurn3DProps) {
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next")
  const [pdfFailed, setPdfFailed] = useState(false)
  const bookRef = useRef<HTMLDivElement>(null)

  const dragX = useMotionValue(0)
  const rotateY = useTransform(dragX, [-300, 0, 300], [60, 0, -60])
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 25 })

  // Calculate which pages to show (left and right of current spread)
  const leftPageIndex = currentSpread * 2
  const rightPageIndex = currentSpread * 2 + 1

  const leftPage = pages[leftPageIndex]
  const rightPage = pages[rightPageIndex]
  const nextLeftPage = pages[leftPageIndex + 2]
  const prevRightPage = pages[rightPageIndex - 2]

  const themeStyles = {
    light: {
      bg: "bg-[#faf8f5]",
      text: "text-[#2c3e50]",
      pageNum: "text-[#8b9dc3]",
      paper: "from-[#faf8f5] via-[#f5f3f0] to-[#faf8f5]",
    },
    sepia: {
      bg: "bg-[#f4ecd8]",
      text: "text-[#5d4e37]",
      pageNum: "text-[#a89880]",
      paper: "from-[#f4ecd8] via-[#efe6d0] to-[#f4ecd8]",
    },
    dark: {
      bg: "bg-[#2d2d2d]",
      text: "text-[#d4d4d4]",
      pageNum: "text-[#6b7280]",
      paper: "from-[#2d2d2d] via-[#333333] to-[#2d2d2d]",
    },
    night: {
      bg: "bg-[#1a1a1a]",
      text: "text-[#b8b8b8]",
      pageNum: "text-[#4b5563]",
      paper: "from-[#1a1a1a] via-[#222222] to-[#1a1a1a]",
    },
  }

  const fontSizeStyles = {
    small: "text-[14px]",
    medium: "text-[16px]",
    large: "text-[18px]",
    xlarge: "text-[20px]",
  }

  const lineHeightStyles = {
    tight: "leading-[1.6]",
    normal: "leading-[1.8]",
    relaxed: "leading-[2]",
  }

  const marginStyles = {
    narrow: "px-8 py-6",
    normal: "px-12 py-8",
    wide: "px-16 py-10",
  }

  const theme = themeStyles[settings.theme]
  const fontSize = fontSizeStyles[settings.fontSize]
  const lineHeight = lineHeightStyles[settings.lineHeight]
  const margins = marginStyles[settings.margins]

  const handleFlip = useCallback(
    (direction: "next" | "prev") => {
      if (isFlipping) return

      const maxSpread = Math.ceil(pages.length / 2) - 1
      if (direction === "next" && currentSpread >= maxSpread) return
      if (direction === "prev" && currentSpread <= 0) return

      setIsFlipping(true)
      setFlipDirection(direction)

      setTimeout(() => {
        onSpreadChange(direction === "next" ? currentSpread + 1 : currentSpread - 1)
        setIsFlipping(false)
      }, 700)
    },
    [isFlipping, currentSpread, onSpreadChange, pages.length],
  )

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const threshold = 80
      const velocity = info.velocity.x

      if (info.offset.x < -threshold || velocity < -400) {
        handleFlip("next")
      } else if (info.offset.x > threshold || velocity > 400) {
        handleFlip("prev")
      }
    },
    [handleFlip],
  )

  const renderContent = (page: Page | undefined, isLeftPage: boolean) => {
    if (!page) return null

    // If we have a PDF URL and PDF didn't fail, render the actual PDF page
    if (pdfUrl && !pdfFailed) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <PdfPage
            pdfUrl={pdfUrl}
            pageNumber={page.number}
            className="h-full w-full"
            onError={() => setPdfFailed(true)}
          />
        </div>
      )
    }

    // Fallback: Check if this is page 1 (title page on right side)
    if (page.number === 1 && !isLeftPage) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <h1 className={`font-serif text-3xl font-normal tracking-wide ${theme.text}`}>{bookTitle}</h1>
          <div
            className={`mt-6 h-px w-12 ${settings.theme === "light" || settings.theme === "sepia" ? "bg-[#2c3e50]/20" : "bg-white/20"}`}
          />
          <p className={`mt-6 font-sans text-sm uppercase tracking-[0.2em] ${theme.pageNum}`}>{bookAuthor}</p>
        </div>
      )
    }

    const content = page.content
    const isChapterStart = page.isChapterStart || page.number === 2

    if (isChapterStart && content.length > 0) {
      const firstLetter = content.charAt(0)
      const restOfContent = content.slice(1)

      return (
        <div className="h-full">
          {page.chapterTitle && (
            <h2 className={`mb-8 text-center font-serif text-xl ${theme.text}`}>{page.chapterTitle}</h2>
          )}
          <p className={`font-serif ${fontSize} ${lineHeight} ${theme.text} text-justify`}>
            {/* Drop cap */}
            <span
              className="float-left mr-3 mt-1 font-serif text-[3.5rem] leading-[0.8]"
              style={{ fontVariant: "small-caps" }}
            >
              {firstLetter}
            </span>
            {restOfContent}
          </p>
        </div>
      )
    }

    return <p className={`font-serif ${fontSize} ${lineHeight} ${theme.text} text-justify`}>{content}</p>
  }

  const brightnessStyle = { filter: `brightness(${settings.brightness}%)` }

  return (
    <div ref={bookRef} className="relative select-none" style={{ perspective: "2500px", ...brightnessStyle }}>
      {/* Book Container */}
      <div className="relative flex" style={{ transformStyle: "preserve-3d" }}>
        {/* Left Page */}
        <div
          className={`relative h-[70vh] w-[38vw] min-w-[280px] max-w-[420px] overflow-hidden ${theme.bg}`}
          style={{
            boxShadow: "inset -2px 0 8px rgba(0,0,0,0.1), -4px 0 16px rgba(0,0,0,0.08)",
            borderRadius: "2px 0 0 2px",
          }}
        >
          {/* Paper texture gradient */}
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${theme.paper} opacity-50`} />

          {/* Page Content */}
          <div className={`relative flex h-full flex-col ${margins}`}>
            <div className={`mb-6 text-center font-serif text-xs ${theme.pageNum}`}>{leftPage?.number || ""}</div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">{renderContent(leftPage, true)}</div>
          </div>

          {/* Page edge shadow on right */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-8"
            style={{
              background: "linear-gradient(to left, rgba(0,0,0,0.08), rgba(0,0,0,0.02) 40%, transparent)",
            }}
          />

          {/* Subtle page lines at edge */}
          <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-[3px]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute right-0 h-[1px] bg-foreground/[0.03]"
                style={{
                  top: `${10 + i * 10}%`,
                  width: `${3 - i * 0.3}px`,
                }}
              />
            ))}
          </div>
        </div>

        <div
          className="relative w-4 flex-shrink-0"
          style={{
            background:
              settings.theme === "light" || settings.theme === "sepia"
                ? "linear-gradient(to right, #d4cfc7, #c9c4bc 20%, #bdb8b0 50%, #c9c4bc 80%, #d4cfc7)"
                : "linear-gradient(to right, #3a3a3a, #2d2d2d 20%, #252525 50%, #2d2d2d 80%, #3a3a3a)",
            boxShadow: "inset 0 0 12px rgba(0,0,0,0.3)",
          }}
        >
          {/* Spine highlight */}
          <div
            className="absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2"
            style={{
              background:
                settings.theme === "light" || settings.theme === "sepia"
                  ? "linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.4))"
                  : "linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.1))",
            }}
          />
        </div>

        {/* Right Page - Interactive */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.05}
          onDragEnd={handleDragEnd}
          style={{
            rotateY: springRotateY,
            transformStyle: "preserve-3d",
            transformOrigin: "left center",
          }}
          className={`relative h-[70vh] w-[38vw] min-w-[280px] max-w-[420px] cursor-grab overflow-hidden ${theme.bg} active:cursor-grabbing`}
          whileTap={{ cursor: "grabbing" }}
        >
          {/* Paper texture gradient */}
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-l ${theme.paper} opacity-50`} />

          {/* Page Content */}
          <div className={`relative flex h-full flex-col ${margins}`}>
            <div className={`mb-6 text-center font-serif text-xs ${theme.pageNum}`}>{rightPage?.number || ""}</div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">{renderContent(rightPage, false)}</div>
          </div>

          {/* Page edge shadow on left */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-8"
            style={{
              background: "linear-gradient(to right, rgba(0,0,0,0.08), rgba(0,0,0,0.02) 40%, transparent)",
            }}
          />

          {/* Page edge effect - visible stacked pages */}
          <div
            className="pointer-events-none absolute inset-y-4 right-0 w-1"
            style={{
              background:
                settings.theme === "light" || settings.theme === "sepia"
                  ? "linear-gradient(to left, #e8e5e0, #f0ede8)"
                  : "linear-gradient(to left, #3a3a3a, #444444)",
              boxShadow: "1px 0 2px rgba(0,0,0,0.1)",
            }}
          />

          {/* Page styling */}
          <div
            className="pointer-events-none absolute bottom-0 right-0 top-0"
            style={{
              width: "2px",
              borderRadius: "0 2px 2px 0",
            }}
          />
        </motion.div>
      </div>

      <AnimatePresence>
        {isFlipping && (
          <motion.div
            initial={{
              rotateY: flipDirection === "next" ? 0 : -180,
              z: 10,
            }}
            animate={{
              rotateY: flipDirection === "next" ? -180 : 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.7,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: flipDirection === "next" ? "left center" : "right center",
              position: "absolute",
              left: flipDirection === "next" ? "calc(50% + 8px)" : "0",
              top: 0,
            }}
            className="pointer-events-none h-[70vh] w-[38vw] min-w-[280px] max-w-[420px]"
          >
            {/* Front of flipping page */}
            <div
              className={`absolute inset-0 overflow-hidden ${theme.bg}`}
              style={{
                backfaceVisibility: "hidden",
                boxShadow: "-8px 0 24px rgba(0,0,0,0.2)",
              }}
            >
              <div className={`flex h-full flex-col ${margins}`}>
                <div className={`mb-6 text-center font-serif text-xs ${theme.pageNum}`}>
                  {flipDirection === "next" ? rightPage?.number : leftPage?.number}
                </div>
                <div className="flex-1 overflow-hidden">
                  {renderContent(flipDirection === "next" ? rightPage : leftPage, flipDirection !== "next")}
                </div>
              </div>
            </div>

            {/* Back of flipping page */}
            <div
              className={`absolute inset-0 overflow-hidden ${theme.bg}`}
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                boxShadow: "8px 0 24px rgba(0,0,0,0.2)",
              }}
            >
              <div className={`flex h-full flex-col ${margins}`}>
                <div className={`mb-6 text-center font-serif text-xs ${theme.pageNum}`}>
                  {flipDirection === "next" ? nextLeftPage?.number : prevRightPage?.number}
                </div>
                <div className="flex-1 overflow-hidden">
                  {renderContent(flipDirection === "next" ? nextLeftPage : prevRightPage, flipDirection === "next")}
                </div>
              </div>
            </div>

            {/* Page curl shadow */}
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 0.7 }}
              style={{
                background: "linear-gradient(to right, transparent, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0.2))",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click Areas for Page Turn */}
      <div onClick={() => handleFlip("prev")} className="absolute left-0 top-0 h-full w-[30%] cursor-pointer" />
      <div onClick={() => handleFlip("next")} className="absolute right-0 top-0 h-full w-[30%] cursor-pointer" />

      {/* Book shadow */}
      <div
        className="absolute -bottom-6 left-1/2 h-8 w-[90%] -translate-x-1/2"
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />
    </div>
  )
}
