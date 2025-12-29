"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import {
    Play,
    Pause,
    RotateCcw,
    RotateCw,
    X,
    Volume2,
    VolumeX,
    Palette,
    ChevronDown,
    ChevronUp,
    Headphones,
    Minimize2,
    Maximize2,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export type AudiobookTheme = "cream" | "dark" | "forest" | "ocean"

interface Chapter {
    id: string
    title: string
    duration: number
}

interface AudiobookBook {
    id?: string
    title: string
    author: string
    coverUrl?: string
    chapters?: Chapter[]
    // Audio source fields
    audioUrl?: string
    duration?: number
    lastPosition?: number
}

export interface AudiobookPlayerProps {
    isOpen: boolean
    onClose: () => void
    book: AudiobookBook
    audioSrc?: string
    theme?: AudiobookTheme
    onThemeChange?: (theme: AudiobookTheme) => void
    initialTime?: number
    // Mini-player support
    isMinimized?: boolean
    onMinimize?: () => void
    onMaximize?: () => void
    // External state control (from context)
    externalIsPlaying?: boolean
    externalCurrentTime?: number
    externalDuration?: number
    onPlayPause?: () => void
    onSeek?: (time: number) => void
    onSkip?: (seconds: number) => void
    // Progress persistence
    onProgressSave?: (bookId: string, position: number) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme Definitions
// ─────────────────────────────────────────────────────────────────────────────

export const THEMES = {
    cream: {
        name: "Cream",
        background: "#F9F7F1",
        backgroundGlass: "rgba(249, 247, 241, 0.92)",
        accent: "#D97706",
        accentLight: "rgba(217, 119, 6, 0.15)",
        text: "#333333",
        textMuted: "#666666",
        border: "rgba(0, 0, 0, 0.08)",
        waveformBase: "#E5E2DC",
        controlBg: "rgba(255, 255, 255, 0.9)",
        controlHover: "rgba(217, 119, 6, 0.1)",
    },
    dark: {
        name: "Dark",
        background: "#1A1A1A",
        backgroundGlass: "rgba(26, 26, 26, 0.95)",
        accent: "#9B5DE5",
        accentLight: "rgba(155, 93, 229, 0.2)",
        text: "#F5F5DC",
        textMuted: "#A0A0A0",
        border: "rgba(255, 255, 255, 0.1)",
        waveformBase: "#2D2D2D",
        controlBg: "rgba(45, 45, 45, 0.9)",
        controlHover: "rgba(155, 93, 229, 0.15)",
    },
    forest: {
        name: "Forest",
        background: "#E8EDE4",
        backgroundGlass: "rgba(232, 237, 228, 0.92)",
        accent: "#2D5A4A",
        accentLight: "rgba(45, 90, 74, 0.12)",
        text: "#1A3A2A",
        textMuted: "#4A6A5A",
        border: "rgba(45, 90, 74, 0.15)",
        waveformBase: "#D0D8CC",
        controlBg: "rgba(255, 255, 255, 0.85)",
        controlHover: "rgba(45, 90, 74, 0.1)",
    },
    ocean: {
        name: "Ocean",
        background: "#E6F2F8",
        backgroundGlass: "rgba(230, 242, 248, 0.92)",
        accent: "#E07B67",
        accentLight: "rgba(224, 123, 103, 0.15)",
        text: "#1E3A5F",
        textMuted: "#5A7A9A",
        border: "rgba(30, 58, 95, 0.12)",
        waveformBase: "#CCE0EC",
        controlBg: "rgba(255, 255, 255, 0.9)",
        controlHover: "rgba(224, 123, 103, 0.1)",
    },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Mini Waveform for Mini-Player
// ─────────────────────────────────────────────────────────────────────────────

interface MiniWaveformProps {
    progress: number
    isPlaying: boolean
    theme: typeof THEMES[AudiobookTheme]
}

function MiniWaveform({ progress, isPlaying, theme }: MiniWaveformProps) {
    const bars = 12

    return (
        <div className="flex items-center gap-[2px] h-6">
            {Array.from({ length: bars }).map((_, i) => {
                const isActive = i / bars <= progress

                return (
                    <motion.div
                        key={i}
                        className="w-1 rounded-full"
                        style={{
                            backgroundColor: isActive ? theme.accent : theme.waveformBase,
                            height: `${30 + Math.sin(i * 0.8) * 40 + 30}%`,
                        }}
                        animate={
                            isPlaying && isActive
                                ? {
                                    scaleY: [1, 1.4, 0.8, 1.2, 1],
                                    transition: {
                                        duration: 0.6,
                                        repeat: Infinity,
                                        delay: i * 0.05,
                                    },
                                }
                                : { scaleY: 1 }
                        }
                    />
                )
            })}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini-Player Bar Component (Spotify-style)
// ─────────────────────────────────────────────────────────────────────────────

interface MiniPlayerBarProps {
    book: AudiobookBook
    isPlaying: boolean
    currentTime: number
    duration: number
    theme: typeof THEMES[AudiobookTheme]
    onPlayPause: () => void
    onMaximize: () => void
    onClose: () => void
    onSkip: (seconds: number) => void
}

function MiniPlayerBar({
    book,
    isPlaying,
    currentTime,
    duration,
    theme,
    onPlayPause,
    onMaximize,
    onClose,
    onSkip,
}: MiniPlayerBarProps) {
    const progress = duration > 0 ? currentTime / duration : 0

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t shadow-2xl"
            style={{
                backgroundColor: theme.backgroundGlass,
                borderColor: theme.border,
                backdropFilter: "blur(20px)",
            }}
        >
            {/* Progress bar at top */}
            <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: theme.waveformBase }}
            >
                <motion.div
                    className="h-full"
                    style={{ backgroundColor: theme.accent, width: `${progress * 100}%` }}
                    layoutId="mini-progress"
                />
            </div>

            <div className="flex items-center gap-4 px-4 py-3 max-w-7xl mx-auto">
                {/* Book Cover Thumbnail */}
                <motion.div
                    layoutId={book.id ? `book-cover-${book.id}` : undefined}
                    className="relative w-12 h-16 rounded-lg overflow-hidden shadow-lg flex-shrink-0"
                >
                    {book.coverUrl ? (
                        <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: theme.accentLight }}
                        >
                            <Headphones size={20} style={{ color: theme.accent }} />
                        </div>
                    )}
                </motion.div>

                {/* Book Info */}
                <div className="flex-1 min-w-0">
                    <h4
                        className="font-serif font-semibold text-sm truncate"
                        style={{ color: theme.text }}
                    >
                        {book.title}
                    </h4>
                    <p
                        className="text-xs truncate"
                        style={{ color: theme.textMuted }}
                    >
                        {book.author}
                    </p>
                </div>

                {/* Mini Waveform (hidden on small screens) */}
                <div className="hidden md:block">
                    <MiniWaveform
                        progress={progress}
                        isPlaying={isPlaying}
                        theme={theme}
                    />
                </div>

                {/* Time Display */}
                <div
                    className="hidden sm:block text-xs font-mono"
                    style={{ color: theme.textMuted }}
                >
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    {/* Skip Back */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onSkip(-15)}
                        className="p-2 rounded-full hidden sm:flex items-center justify-center"
                        style={{ color: theme.textMuted }}
                        aria-label="Skip back 15 seconds"
                    >
                        <RotateCcw size={18} />
                    </motion.button>

                    {/* Play/Pause */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onPlayPause}
                        className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                        style={{
                            backgroundColor: theme.accent,
                            color: "#FFFFFF",
                        }}
                        aria-label={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? (
                            <Pause size={18} fill="currentColor" />
                        ) : (
                            <Play size={18} fill="currentColor" className="ml-0.5" />
                        )}
                    </motion.button>

                    {/* Skip Forward */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onSkip(15)}
                        className="p-2 rounded-full hidden sm:flex items-center justify-center"
                        style={{ color: theme.textMuted }}
                        aria-label="Skip forward 15 seconds"
                    >
                        <RotateCw size={18} />
                    </motion.button>

                    {/* Expand Button */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onMaximize}
                        className="p-2 rounded-full"
                        style={{ color: theme.textMuted }}
                        aria-label="Expand player"
                    >
                        <Maximize2 size={18} />
                    </motion.button>

                    {/* Close Button */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="p-2 rounded-full"
                        style={{ color: theme.textMuted }}
                        aria-label="Close player"
                    >
                        <X size={18} />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Waveform Visualizer Component
// ─────────────────────────────────────────────────────────────────────────────

interface WaveformVisualizerProps {
    progress: number
    isPlaying: boolean
    theme: typeof THEMES[AudiobookTheme]
    barCount?: number
}

function WaveformVisualizer({
    progress,
    isPlaying,
    theme,
    barCount = 48,
}: WaveformVisualizerProps) {
    const [heights, setHeights] = useState<number[]>([])

    useEffect(() => {
        const newHeights = Array.from({ length: barCount }, () =>
            Math.random() * 0.7 + 0.3
        )
        setHeights(newHeights)
    }, [barCount])

    const playedBars = Math.floor(progress * barCount)

    return (
        <div className="flex items-end justify-between gap-[2px] h-12 w-full px-1">
            {heights.map((height, index) => {
                const isPlayed = index <= playedBars
                const isActive = index === playedBars && isPlaying

                return (
                    <motion.div
                        key={index}
                        className="flex-1 rounded-full min-w-[3px] max-w-[6px]"
                        style={{
                            backgroundColor: isPlayed ? theme.accent : theme.waveformBase,
                            height: `${height * 100}%`,
                        }}
                        animate={
                            isActive && isPlaying
                                ? {
                                    scaleY: [1, 1.3, 0.8, 1.1, 1],
                                    transition: {
                                        duration: 0.5,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    },
                                }
                                : { scaleY: 1 }
                        }
                    />
                )
            })}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Time Display Component
// ─────────────────────────────────────────────────────────────────────────────

interface TimeDisplayProps {
    currentTime: number
    duration: number
    theme: typeof THEMES[AudiobookTheme]
}

function TimeDisplay({ currentTime, duration, theme }: TimeDisplayProps) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    return (
        <div
            className="flex items-center justify-between text-sm font-mono tracking-wider"
            style={{ color: theme.textMuted }}
        >
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Control Button Component
// ─────────────────────────────────────────────────────────────────────────────

interface ControlButtonProps {
    onClick: () => void
    theme: typeof THEMES[AudiobookTheme]
    size?: "sm" | "md" | "lg"
    isMain?: boolean
    children: React.ReactNode
    label: string
}

function ControlButton({
    onClick,
    theme,
    size = "md",
    isMain = false,
    children,
    label,
}: ControlButtonProps) {
    const sizeClasses = {
        sm: "h-10 w-10",
        md: "h-12 w-12",
        lg: "h-16 w-16",
    }

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all duration-200 shadow-md`}
            style={{
                backgroundColor: isMain ? theme.accent : theme.controlBg,
                color: isMain ? "#FFFFFF" : theme.text,
                border: isMain ? "none" : `1px solid ${theme.border}`,
                boxShadow: isMain
                    ? `0 4px 20px ${theme.accentLight}`
                    : "0 2px 8px rgba(0,0,0,0.08)",
            }}
            aria-label={label}
        >
            {children}
        </motion.button>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme Selector Component
// ─────────────────────────────────────────────────────────────────────────────

interface ThemeSelectorProps {
    currentTheme: AudiobookTheme
    onThemeChange: (theme: AudiobookTheme) => void
    theme: typeof THEMES[AudiobookTheme]
}

function ThemeSelector({
    currentTheme,
    onThemeChange,
    theme,
}: ThemeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors"
                style={{
                    backgroundColor: theme.accentLight,
                    color: theme.accent,
                }}
            >
                <Palette size={16} />
                <span className="hidden sm:inline">{THEMES[currentTheme].name}</span>
                <ChevronDown
                    size={14}
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        className="absolute top-full left-0 mt-2 p-2 rounded-xl shadow-xl z-50 min-w-[140px]"
                        style={{
                            backgroundColor: theme.controlBg,
                            border: `1px solid ${theme.border}`,
                            backdropFilter: "blur(12px)",
                        }}
                    >
                        {(Object.keys(THEMES) as AudiobookTheme[]).map((themeKey) => (
                            <button
                                key={themeKey}
                                onClick={() => {
                                    onThemeChange(themeKey)
                                    setIsOpen(false)
                                }}
                                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors"
                                style={{
                                    color: currentTheme === themeKey ? theme.accent : theme.text,
                                    backgroundColor:
                                        currentTheme === themeKey ? theme.accentLight : "transparent",
                                }}
                            >
                                <div
                                    className="w-4 h-4 rounded-full border-2"
                                    style={{
                                        backgroundColor: THEMES[themeKey].accent,
                                        borderColor: THEMES[themeKey].background,
                                    }}
                                />
                                {THEMES[themeKey].name}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Audiobook Player Component
// ─────────────────────────────────────────────────────────────────────────────

export function AudiobookPlayer({
    isOpen,
    onClose,
    book,
    audioSrc,
    theme: initialTheme = "cream",
    onThemeChange,
    initialTime = 0,
    isMinimized = false,
    onMinimize,
    onMaximize,
    externalIsPlaying,
    externalCurrentTime,
    externalDuration,
    onPlayPause,
    onSeek,
    onSkip,
    onProgressSave,
}: AudiobookPlayerProps) {
    // Determine audio source: use book.audioUrl if available, fallback to audioSrc prop
    const effectiveAudioSrc = book.audioUrl || audioSrc
    const effectiveInitialTime = book.lastPosition || initialTime
    // Internal state (used when not controlled externally)
    const [internalTheme, setInternalTheme] = useState<AudiobookTheme>(initialTheme)
    const [internalIsPlaying, setInternalIsPlaying] = useState(false)
    const [internalCurrentTime, setInternalCurrentTime] = useState(effectiveInitialTime)
    const [internalDuration, setInternalDuration] = useState(book.duration || 0)
    const [isMuted, setIsMuted] = useState(false)
    const [currentChapter, setCurrentChapter] = useState(0)
    const [playbackSpeed, setPlaybackSpeed] = useState(1)

    // Refs
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Use external or internal state
    const isPlaying = externalIsPlaying ?? internalIsPlaying
    const currentTime = externalCurrentTime ?? internalCurrentTime
    const duration = externalDuration ?? internalDuration
    const currentTheme = internalTheme

    // Get current theme colors
    const theme = THEMES[currentTheme]

    // Handle theme change
    const handleThemeChange = useCallback(
        (newTheme: AudiobookTheme) => {
            setInternalTheme(newTheme)
            onThemeChange?.(newTheme)
        },
        [onThemeChange]
    )

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleTimeUpdate = () => setInternalCurrentTime(audio.currentTime)
        const handleDurationChange = () => setInternalDuration(audio.duration || 0)
        const handleEnded = () => setInternalIsPlaying(false)

        audio.addEventListener("timeupdate", handleTimeUpdate)
        audio.addEventListener("durationchange", handleDurationChange)
        audio.addEventListener("ended", handleEnded)

        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate)
            audio.removeEventListener("durationchange", handleDurationChange)
            audio.removeEventListener("ended", handleEnded)
        }
    }, [])

    // Play/Pause toggle
    const togglePlay = useCallback(() => {
        if (onPlayPause) {
            onPlayPause()
            return
        }

        const audio = audioRef.current
        if (!audio) {
            setInternalIsPlaying(!internalIsPlaying)
            return
        }

        if (internalIsPlaying) {
            audio.pause()
        } else {
            audio.play().catch(console.error)
        }
        setInternalIsPlaying(!internalIsPlaying)
    }, [onPlayPause, internalIsPlaying])

    // Skip forward/backward
    const handleSkip = useCallback(
        (seconds: number) => {
            if (onSkip) {
                onSkip(seconds)
                return
            }

            const audio = audioRef.current
            if (audio) {
                audio.currentTime = Math.max(
                    0,
                    Math.min(audio.duration || duration, audio.currentTime + seconds)
                )
            } else {
                const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
                setInternalCurrentTime(newTime)
            }
        },
        [onSkip, duration, currentTime]
    )

    // Toggle mute
    const toggleMute = useCallback(() => {
        const audio = audioRef.current
        if (audio) {
            audio.muted = !isMuted
        }
        setIsMuted(!isMuted)
    }, [isMuted])

    // Progress for waveform
    const progress = duration > 0 ? currentTime / duration : 0

    // Demo duration for visualization when no audio
    useEffect(() => {
        if (!effectiveAudioSrc && internalDuration === 0 && !book.duration) {
            setInternalDuration(2745) // 45:45 demo duration
        }
    }, [effectiveAudioSrc, internalDuration, book.duration])

    // Initialize audio position when audio loads
    useEffect(() => {
        const audio = audioRef.current
        if (audio && effectiveInitialTime > 0) {
            audio.currentTime = effectiveInitialTime
        }
    }, [effectiveAudioSrc])

    // Progress persistence - save every 10 seconds
    useEffect(() => {
        if (!book.id || currentTime === 0) return

        const saveProgress = () => {
            // Save to localStorage for quick resume
            localStorage.setItem(`audiobook-progress-${book.id}`, String(Math.floor(currentTime)))

            // Trigger callback for DB persistence
            if (onProgressSave) {
                onProgressSave(book.id, Math.floor(currentTime))
            }
        }

        const interval = setInterval(saveProgress, 10000) // Every 10 seconds
        return () => clearInterval(interval)
    }, [book.id, currentTime, onProgressSave])

    // Save progress on unmount
    useEffect(() => {
        return () => {
            if (book.id && internalCurrentTime > 0) {
                localStorage.setItem(`audiobook-progress-${book.id}`, String(Math.floor(internalCurrentTime)))
                if (onProgressSave) {
                    onProgressSave(book.id, Math.floor(internalCurrentTime))
                }
            }
        }
    }, [book.id, internalCurrentTime, onProgressSave])

    // Don't render if not open
    if (!isOpen) return null

    // Render Mini-Player if minimized
    if (isMinimized) {
        return (
            <AnimatePresence>
                <MiniPlayerBar
                    book={book}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    theme={theme}
                    onPlayPause={togglePlay}
                    onMaximize={onMaximize || (() => { })}
                    onClose={onClose}
                    onSkip={handleSkip}
                />
            </AnimatePresence>
        )
    }

    // Render Full Modal
    return (
        <LayoutGroup>
            {/* Hidden audio element */}
            {effectiveAudioSrc && <audio ref={audioRef} src={effectiveAudioSrc} preload="metadata" />}

            <AnimatePresence>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onMinimize || onClose}
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 20 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-2xl"
                    style={{
                        backgroundColor: theme.backgroundGlass,
                        backdropFilter: "blur(24px)",
                        border: `1px solid ${theme.border}`,
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-6 py-4 border-b"
                        style={{ borderColor: theme.border }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="flex items-center justify-center w-10 h-10 rounded-xl"
                                style={{ backgroundColor: theme.accentLight }}
                            >
                                <Headphones size={20} style={{ color: theme.accent }} />
                            </div>
                            <span
                                className="font-medium text-sm"
                                style={{ color: theme.textMuted }}
                            >
                                Now Playing
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <ThemeSelector
                                currentTheme={currentTheme}
                                onThemeChange={handleThemeChange}
                                theme={theme}
                            />

                            {onMinimize && (
                                <motion.button
                                    onClick={onMinimize}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2 rounded-full transition-colors"
                                    style={{ color: theme.textMuted }}
                                    aria-label="Minimize player"
                                >
                                    <Minimize2 size={18} />
                                </motion.button>
                            )}

                            <motion.button
                                onClick={onClose}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 rounded-full transition-colors"
                                style={{ color: theme.textMuted }}
                                aria-label="Close player"
                            >
                                <X size={20} />
                            </motion.button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col md:flex-row gap-6 p-6">
                        {/* Book Cover with layoutId for shared element transition */}
                        <div className="flex-shrink-0">
                            <motion.div
                                layoutId={book.id ? `book-cover-${book.id}` : undefined}
                                className="relative w-48 h-64 mx-auto md:mx-0 rounded-xl overflow-hidden shadow-xl"
                                style={{
                                    boxShadow: `8px 8px 24px rgba(0,0,0,0.15), -2px -2px 8px rgba(255,255,255,0.5)`,
                                }}
                            >
                                {book.coverUrl ? (
                                    <img
                                        src={book.coverUrl}
                                        alt={book.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center"
                                        style={{
                                            background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentLight} 100%)`,
                                        }}
                                    >
                                        <Headphones size={48} color="#fff" />
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Player Controls */}
                        <div className="flex-1 flex flex-col justify-between min-h-[256px]">
                            {/* Book Info */}
                            <div className="space-y-2">
                                <h2
                                    className="font-serif text-2xl font-bold tracking-tight"
                                    style={{ color: theme.text }}
                                >
                                    {book.title}
                                </h2>
                                <p
                                    className="text-sm font-medium"
                                    style={{ color: theme.textMuted }}
                                >
                                    {book.author}
                                </p>
                                {book.chapters && book.chapters.length > 0 && (
                                    <p
                                        className="text-xs font-medium uppercase tracking-wide pt-2"
                                        style={{ color: theme.accent }}
                                    >
                                        {book.chapters[currentChapter]?.title || "Chapter 1"}
                                    </p>
                                )}
                            </div>

                            {/* Waveform Progress */}
                            <div className="space-y-3 py-4">
                                <WaveformVisualizer
                                    progress={progress}
                                    isPlaying={isPlaying}
                                    theme={theme}
                                />
                                <TimeDisplay
                                    currentTime={currentTime}
                                    duration={duration}
                                    theme={theme}
                                />
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-4">
                                {/* Mute Button */}
                                <motion.button
                                    onClick={toggleMute}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2"
                                    style={{ color: theme.textMuted }}
                                >
                                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                </motion.button>

                                {/* Skip Back 15s */}
                                <ControlButton
                                    onClick={() => handleSkip(-15)}
                                    theme={theme}
                                    size="md"
                                    label="Skip back 15 seconds"
                                >
                                    <RotateCcw size={20} />
                                </ControlButton>

                                {/* Play/Pause */}
                                <ControlButton
                                    onClick={togglePlay}
                                    theme={theme}
                                    size="lg"
                                    isMain
                                    label={isPlaying ? "Pause" : "Play"}
                                >
                                    {isPlaying ? (
                                        <Pause size={28} fill="currentColor" />
                                    ) : (
                                        <Play size={28} fill="currentColor" className="ml-1" />
                                    )}
                                </ControlButton>

                                {/* Skip Forward 15s */}
                                <ControlButton
                                    onClick={() => handleSkip(15)}
                                    theme={theme}
                                    size="md"
                                    label="Skip forward 15 seconds"
                                >
                                    <RotateCw size={20} />
                                </ControlButton>

                                {/* Volume placeholder for symmetry */}
                                <div className="w-9" />
                            </div>
                        </div>
                    </div>

                    {/* Footer with playback speed */}
                    <div
                        className="flex items-center justify-center gap-4 px-6 py-3 border-t"
                        style={{ borderColor: theme.border }}
                    >
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                            <button
                                key={speed}
                                onClick={() => setPlaybackSpeed(speed)}
                                className="px-2 py-1 text-xs font-medium rounded-md transition-colors"
                                style={{
                                    backgroundColor:
                                        playbackSpeed === speed ? theme.accentLight : "transparent",
                                    color: playbackSpeed === speed ? theme.accent : theme.textMuted,
                                }}
                            >
                                {speed}x
                            </button>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </LayoutGroup>
    )
}

export default AudiobookPlayer
