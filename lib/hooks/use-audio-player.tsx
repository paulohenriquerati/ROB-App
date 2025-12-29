"use client"

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    useEffect,
    type ReactNode,
} from "react"
import type { Book } from "@/lib/types"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AudiobookTheme = "cream" | "dark" | "forest" | "ocean"

export interface AudioPlayerState {
    activeBook: Book | null
    isPlaying: boolean
    isOpen: boolean
    isMinimized: boolean
    currentTime: number
    duration: number
    volume: number
    playbackRate: number
    theme: AudiobookTheme
}

export interface AudioPlayerActions {
    play: (book: Book) => void
    pause: () => void
    resume: () => void
    togglePlay: () => void
    stop: () => void
    close: () => void
    minimize: () => void
    maximize: () => void
    setTheme: (theme: AudiobookTheme) => void
    seek: (time: number) => void
    skip: (seconds: number) => void
    setVolume: (volume: number) => void
    setPlaybackRate: (rate: number) => void
}

type AudioPlayerContextType = AudioPlayerState & AudioPlayerActions

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null)

// ─────────────────────────────────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────────────────────────────────

interface AudioPlayerProviderProps {
    children: ReactNode
}

export function AudioPlayerProvider({ children }: AudioPlayerProviderProps) {
    // State
    const [activeBook, setActiveBook] = useState<Book | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolumeState] = useState(1)
    const [playbackRate, setPlaybackRateState] = useState(1)
    const [theme, setThemeState] = useState<AudiobookTheme>("cream")

    // Audio element ref
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Initialize audio element
    useEffect(() => {
        if (typeof window !== "undefined" && !audioRef.current) {
            audioRef.current = new Audio()
            audioRef.current.preload = "metadata"

            // Event listeners
            audioRef.current.addEventListener("timeupdate", () => {
                setCurrentTime(audioRef.current?.currentTime || 0)
            })

            audioRef.current.addEventListener("durationchange", () => {
                setDuration(audioRef.current?.duration || 0)
            })

            audioRef.current.addEventListener("ended", () => {
                setIsPlaying(false)
            })

            audioRef.current.addEventListener("play", () => {
                setIsPlaying(true)
            })

            audioRef.current.addEventListener("pause", () => {
                setIsPlaying(false)
            })
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.src = ""
            }
        }
    }, [])

    // ─────────────────────────────────────────────────────────────────────────
    // Actions
    // ─────────────────────────────────────────────────────────────────────────

    const play = useCallback((book: Book) => {
        setActiveBook(book)
        setIsOpen(true)
        setIsMinimized(false)
        setCurrentTime(0)

        // Set a demo duration for books without actual audio
        // In production, this would load from book's audio_url
        setDuration(2745) // 45:45 demo

        // If book has an audio URL, load it
        // if (audioRef.current && book.audio_url) {
        //   audioRef.current.src = book.audio_url
        //   audioRef.current.play().catch(console.error)
        // }
    }, [])

    const pause = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
        }
        setIsPlaying(false)
    }, [])

    const resume = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.play().catch(console.error)
        }
        setIsPlaying(true)
    }, [])

    const togglePlay = useCallback(() => {
        if (isPlaying) {
            pause()
        } else {
            resume()
        }
    }, [isPlaying, pause, resume])

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }
        setIsPlaying(false)
        setCurrentTime(0)
    }, [])

    const close = useCallback(() => {
        stop()
        setIsOpen(false)
        setIsMinimized(false)
        setActiveBook(null)
    }, [stop])

    const minimize = useCallback(() => {
        setIsMinimized(true)
    }, [])

    const maximize = useCallback(() => {
        setIsMinimized(false)
    }, [])

    const setTheme = useCallback((newTheme: AudiobookTheme) => {
        setThemeState(newTheme)
    }, [])

    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time
        }
        setCurrentTime(time)
    }, [])

    const skip = useCallback((seconds: number) => {
        const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
        seek(newTime)
    }, [currentTime, duration, seek])

    const setVolume = useCallback((newVolume: number) => {
        if (audioRef.current) {
            audioRef.current.volume = newVolume
        }
        setVolumeState(newVolume)
    }, [])

    const setPlaybackRate = useCallback((rate: number) => {
        if (audioRef.current) {
            audioRef.current.playbackRate = rate
        }
        setPlaybackRateState(rate)
    }, [])

    // ─────────────────────────────────────────────────────────────────────────
    // Context value
    // ─────────────────────────────────────────────────────────────────────────

    const value: AudioPlayerContextType = {
        // State
        activeBook,
        isPlaying,
        isOpen,
        isMinimized,
        currentTime,
        duration,
        volume,
        playbackRate,
        theme,
        // Actions
        play,
        pause,
        resume,
        togglePlay,
        stop,
        close,
        minimize,
        maximize,
        setTheme,
        seek,
        skip,
        setVolume,
        setPlaybackRate,
    }

    return (
        <AudioPlayerContext.Provider value={value}>
            {children}
        </AudioPlayerContext.Provider>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useAudioPlayer() {
    const context = useContext(AudioPlayerContext)

    if (!context) {
        throw new Error("useAudioPlayer must be used within an AudioPlayerProvider")
    }

    return context
}

// ─────────────────────────────────────────────────────────────────────────────
// Optional hook that doesn't throw (for components outside provider)
// ─────────────────────────────────────────────────────────────────────────────

export function useAudioPlayerOptional() {
    return useContext(AudioPlayerContext)
}
