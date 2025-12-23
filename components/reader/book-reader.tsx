"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  ChevronLeft,
  ChevronRight,
  List,
  Type,
  Check,
  Minus,
  Plus,
  Star,
  Settings,
  Sparkles,
} from "lucide-react"
import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { type Book, type ReaderSettings, type PageContent } from "@/lib/types"
import { defaultReaderSettings } from "@/lib/store"
import { BookSpread } from "./book-spread"
import { AmbientSoundPanel } from "./ambient-sound"
import { ReaderSettingsPanel } from "./reader-settings"
import { Volume2 } from "lucide-react"
import { ZoomControls, useZoom } from "./zoom-controls"
import { getBookContent } from "@/lib/actions/transcription"
import { useHighlights } from "@/lib/hooks/use-highlights"
import { createHighlight, updateHighlightColor, deleteHighlight } from "@/lib/actions/highlights"
import type { HighlightColor } from "./highlight-toolbar"

interface BookReaderProps {
  book: Book
  onClose: () => void
  onPageChange: (page: number) => void
}

export function BookReader({ book, onClose, onPageChange }: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(book.current_page || 1)
  const [direction, setDirection] = useState(0)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [activeMenu, setActiveMenu] = useState<"none" | "settings" | "toc" | "rating">("none")
  const [showAmbientSound, setShowAmbientSound] = useState(false)
  const [settings, setSettings] = useState<ReaderSettings>(defaultReaderSettings)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [transcribedPages, setTranscribedPages] = useState<Map<number, PageContent>>(new Map())
  const [isTranscribed, setIsTranscribed] = useState(book.transcription_status === "completed")

  // Highlights management
  const { highlights, getPageHighlights, addHighlight, removeHighlight, updateColor, mutate: mutateHighlights } = useHighlights(book.id)

  // Handle creating a new highlight
  const handleCreateHighlight = async (page: number, text: string, color: HighlightColor) => {
    // Optimistic update
    const tempId = `temp-${Date.now()}`
    addHighlight({
      id: tempId,
      book_id: book.id,
      user_id: '',
      page,
      text,
      color,
      created_at: new Date().toISOString(),
    })

    // Server update
    const { highlight, error } = await createHighlight({
      book_id: book.id,
      page,
      text,
      color,
    })

    if (error) {
      console.error('Failed to create highlight:', error)
      mutateHighlights() // Revert
    } else if (highlight) {
      mutateHighlights() // Sync with server
    }
  }

  // Handle updating highlight color
  const handleUpdateHighlight = async (id: string, color: HighlightColor) => {
    updateColor(id, color)
    const { error } = await updateHighlightColor(id, color)
    if (error) {
      console.error('Failed to update highlight:', error)
      mutateHighlights()
    }
  }

  // Handle deleting a highlight
  const handleDeleteHighlight = async (id: string) => {
    removeHighlight(id)
    const { error } = await deleteHighlight(id)
    if (error) {
      console.error('Failed to delete highlight:', error)
      mutateHighlights()
    }
  }

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load transcribed content if available
  useEffect(() => {
    if (book.transcription_status === "completed") {
      getBookContent(book.id).then(({ pages, error }) => {
        if (!error && pages.length > 0) {
          const pageMap = new Map<number, PageContent>()
          pages.forEach(page => pageMap.set(page.pageNumber, page))
          setTranscribedPages(pageMap)
          setIsTranscribed(true)
        }
      })
    }
  }, [book.id, book.transcription_status])

  const turnPage = useCallback(
    (dir: number) => {
      // On mobile: advance by 1 page; on desktop: advance by 2 (one spread)
      const increment = isMobile ? 1 : 2
      const newPage = currentPage + (dir * increment)
      // Ensure we stay within bounds. 
      // For PDF view, pages are 1-based.
      if (newPage >= 1 && newPage <= book.total_pages) {
        setDirection(dir)
        setCurrentPage(newPage)
        onPageChange(newPage)
      } else if (dir > 0 && currentPage < book.total_pages) {
        // If we can't advance by increment but there's still a page, go to last page
        setDirection(dir)
        setCurrentPage(book.total_pages)
        onPageChange(book.total_pages)
      }
    },
    [currentPage, book.total_pages, onPageChange, isMobile],
  )

  // Use zoom controls hook
  const {
    zoomState,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomHandlers,
    getTransformStyle,
  } = useZoom({ minScale: 1, maxScale: 3, zoomStep: 0.5 })

  // Reset zoom when changing pages
  useEffect(() => {
    resetZoom()
  }, [currentPage, resetZoom])

  // Touch swipe for page navigation (only when not zoomed)
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 })

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && !zoomState.isZoomed) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      }
    }
    // Also call zoom handlers for pinch
    zoomHandlers.onTouchStart(e)
  }, [zoomState.isZoomed, zoomHandlers])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    zoomHandlers.onTouchEnd(e)

    // Only handle swipe for page navigation when not zoomed
    if (!zoomState.isZoomed && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y)
      const elapsed = Date.now() - touchStartRef.current.time

      // Quick horizontal swipe
      if (Math.abs(deltaX) > 50 && deltaY < 100 && elapsed < 300) {
        if (deltaX < 0) {
          turnPage(1) // Swipe left = next
        } else {
          turnPage(-1) // Swipe right = prev
        }
      }
    }
  }, [zoomState.isZoomed, zoomHandlers, turnPage])

  // Auto-hide controls
  useEffect(() => {
    const showControls = () => {
      setControlsVisible(true)
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
      controlsTimeoutRef.current = setTimeout(() => {
        if (activeMenu === "none" && !showAmbientSound) setControlsVisible(false)
      }, 3000)
    }

    window.addEventListener("mousemove", showControls)
    window.addEventListener("keydown", showControls)
    showControls()

    return () => {
      window.removeEventListener("mousemove", showControls)
      window.removeEventListener("keydown", showControls)
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }
  }, [activeMenu, showAmbientSound])

  // Keyboard Nav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeMenu !== "none") {
        if (e.key === "Escape") setActiveMenu("none")
        return
      }
      if (e.key === "ArrowRight" || e.key === " ") turnPage(1)
      if (e.key === "ArrowLeft") turnPage(-1)
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [turnPage, onClose, activeMenu])

  // Background style based on theme
  const getThemeStyles = () => {
    switch (settings.theme) {
      case "sepia":
        return "bg-[#F4ECD8] text-[#433422]"
      case "dark":
        return "bg-[#18181B] text-[#D1D1D6]"
      default:
        return "bg-[#FAFAF9] text-slate-900"
    }
  }

  const toggleMenu = (menu: "settings" | "toc" | "rating") => {
    setActiveMenu(activeMenu === menu ? "none" : menu)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-colors duration-500 ease-in-out ${getThemeStyles()}`}
    >
      {/* Top Control Bar */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            initial={{ y: -64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -64, opacity: 0 }}
            className={`absolute left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b px-6 backdrop-blur-md transition-colors duration-500 ${settings.theme === "dark" ? "bg-[#18181B]/80 border-white/10" : "bg-white/80 border-slate-200"}`}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className={`rounded-full p-2 transition-colors ${settings.theme === "dark" ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <X size={20} />
              </button>
              <div className="flex flex-col">
                <h2
                  className={`text-sm font-semibold leading-none ${settings.theme === "dark" ? "text-white" : "text-slate-900"}`}
                >
                  {book.title}
                </h2>
                <span
                  className={`mt-1 text-xs ${settings.theme === "dark" ? "text-zinc-400" : "text-slate-500"}`}
                >
                  {book.author}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* TOC Toggle */}
              <div className="relative">
                <button
                  onClick={() => toggleMenu("toc")}
                  className={`rounded-full p-2 transition-colors ${activeMenu === "toc" ? (settings.theme === "dark" ? "bg-white/20" : "bg-slate-100") : ""} ${settings.theme === "dark" ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <List size={20} />
                </button>
                {activeMenu === "toc" && (
                  <div
                    className={`animate-in fade-in slide-in-from-top-2 absolute right-0 top-full mt-3 flex w-64 flex-col overflow-hidden rounded-xl border p-2 shadow-2xl ${settings.theme === "dark" ? "bg-[#27272A] border-white/10 text-zinc-200" : "bg-white border-slate-200 text-slate-700"}`}
                  >
                    <p className="mb-1 border-b border-inherit px-3 py-2 text-xs font-bold uppercase tracking-wider opacity-50">
                      Contents
                    </p>
                    <div className="max-h-64 overflow-y-auto">
                      {Array.from({ length: Math.ceil(book.total_pages / 20) }, (_, i) => {
                        const page = i * 20 + 1;
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setCurrentPage(page)
                              setActiveMenu("none")
                              onPageChange(page)
                            }}
                            className="flex w-full justify-between rounded-lg px-3 py-2 text-left text-sm opacity-80 hover:bg-current/10 hover:opacity-100"
                          >
                            <span>Chapter {i + 1}</span>
                            <span className="opacity-50">{page}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Settings Toggle */}
              <div className="relative">
                <button
                  onClick={() => toggleMenu("settings")}
                  className={`rounded-full p-2 transition-colors ${activeMenu === "settings" ? (settings.theme === "dark" ? "bg-white/20" : "bg-slate-100") : ""} ${settings.theme === "dark" ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <Type size={20} />
                </button>
              </div>

              {/* Rating Toggle */}
              <div className="relative">
                <button
                  onClick={() => toggleMenu("rating")}
                  className={`flex items-center gap-1 rounded-full p-2 transition-colors ${activeMenu === "rating" ? (settings.theme === "dark" ? "bg-white/20" : "bg-slate-100") : ""} ${settings.theme === "dark" ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <Star size={18} fill={book.rating > 0 ? "currentColor" : "none"} />
                </button>
                {activeMenu === "rating" && (
                  <div
                    className={`animate-in fade-in slide-in-from-top-2 absolute right-0 top-full mt-3 flex gap-1 rounded-xl border p-3 shadow-2xl ${settings.theme === "dark" ? "bg-[#27272A] border-white/10" : "bg-white border-slate-200"}`}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => {
                          // In a real app, update rating
                          setActiveMenu("none")
                        }}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          size={24}
                          fill={star <= book.rating ? "currentColor" : "none"}
                          className={
                            star <= book.rating
                              ? "text-amber-400"
                              : settings.theme === "dark"
                                ? "text-zinc-600"
                                : "text-slate-300"
                          }
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )
        }

      </AnimatePresence >

      {/* Reader Settings Panel - placed outside AnimatePresence to prevent clipping from transform */}
      <ReaderSettingsPanel
        settings={settings}
        onSettingsChange={setSettings}
        isOpen={activeMenu === "settings"}
        onClose={() => setActiveMenu("none")}
      />

      {/* Book Container (Perspective) */}
      <div
        className="perspective-1000 relative flex h-full w-full items-center justify-center p-4 md:p-8 lg:p-12"
        onTouchStart={handleTouchStart}
        onTouchMove={zoomHandlers.onTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={zoomHandlers.onMouseDown}
        onMouseMove={zoomHandlers.onMouseMove}
        onMouseUp={zoomHandlers.onMouseUp}
        onMouseLeave={zoomHandlers.onMouseUp}
        onWheel={zoomHandlers.onWheel}
        style={{ touchAction: zoomState.isZoomed ? 'none' : 'pan-y' }}
      >
        {/* Zoom Controls */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40">
          <AnimatePresence>
            {controlsVisible && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ZoomControls
                  zoomState={zoomState}
                  onZoomIn={zoomIn}
                  onZoomOut={zoomOut}
                  onReset={resetZoom}
                  theme={settings.theme}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Transcription indicator */}
        {isTranscribed && (
          <div className="absolute top-20 right-4 z-40">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md ${settings.theme === "dark"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
            >
              <Sparkles size={12} />
              Enhanced Text
            </div>
          </div>
        )}

        {/* Zoomable content wrapper */}
        <div
          style={getTransformStyle()}
          className="relative w-full max-w-5xl"
        >
          <BookSpread
            currentPage={currentPage}
            direction={direction}
            book={book}
            settings={settings}
            transcribedPages={isTranscribed ? transcribedPages : undefined}
            highlights={highlights}
            onCreateHighlight={handleCreateHighlight}
            onUpdateHighlight={handleUpdateHighlight}
            onDeleteHighlight={handleDeleteHighlight}
          />
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <AnimatePresence>
        {
          controlsVisible && (
            <motion.div
              initial={{ y: 64, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 64, opacity: 0 }}
              className={`absolute bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-center border-t px-6 backdrop-blur-md transition-colors duration-500 ${settings.theme === "dark" ? "bg-[#18181B]/80 border-white/10" : "bg-white/80 border-slate-200"}`}
            >
              <div className="flex w-full max-w-xl items-center gap-6">
                <button
                  onClick={() => turnPage(-1)}
                  className={`rounded-full p-2 disabled:opacity-30 ${settings.theme === "dark" ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"}`}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft />
                </button>

                <div className="group flex flex-1 flex-col gap-2">
                  <input
                    type="range"
                    min="1"
                    max={book.total_pages}
                    value={currentPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      setDirection(val > currentPage ? 1 : -1)
                      setCurrentPage(val)
                      onPageChange(val)
                    }}
                    className={`h-1 w-full cursor-pointer appearance-none rounded-lg transition-all ${settings.theme === "dark" ? "bg-zinc-700 accent-white" : "bg-slate-200 accent-slate-900"}`}
                  />
                  <div
                    className={`flex justify-between text-[10px] font-medium uppercase tracking-wider transition-colors ${settings.theme === "dark" ? "text-zinc-500 group-hover:text-zinc-300" : "text-slate-400 group-hover:text-slate-600"}`}
                  >
                    <span>Page {currentPage}</span>
                    <span>{book.total_pages}</span>
                  </div>
                </div>

                <button
                  onClick={() => turnPage(1)}
                  className={`rounded-full p-2 disabled:opacity-30 ${settings.theme === "dark" ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"}`}
                  disabled={currentPage >= book.total_pages}
                >
                  <ChevronRight />
                </button>
              </div>

              {/* Ambient Sound Toggle */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <div className="relative">
                  <button
                    onClick={() => setShowAmbientSound(!showAmbientSound)}
                    className={`rounded-full p-2 transition-colors ${settings.theme === "dark" ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"}`}
                    title="Ambient Sounds"
                  >
                    <Volume2 />
                  </button>
                  <AmbientSoundPanel
                    isOpen={showAmbientSound}
                    onClose={() => setShowAmbientSound(false)}
                  />
                </div>
              </div>
            </motion.div>
          )
        }
      </AnimatePresence >
    </motion.div >
  )
}
