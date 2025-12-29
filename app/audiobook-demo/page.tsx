"use client"

import { useState } from "react"
import { AudiobookPlayer, AudiobookTheme } from "@/components/reader/audiobook-player"
import { motion } from "framer-motion"
import { Headphones, Play, Palette } from "lucide-react"

// Demo books for showcasing different themes
const DEMO_BOOKS = [
    {
        id: "1",
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
        theme: "cream" as AudiobookTheme,
        chapters: [
            { id: "1", title: "Chapter 1: In My Younger Years", duration: 1200 },
            { id: "2", title: "Chapter 2: The Valley of Ashes", duration: 980 },
            { id: "3", title: "Chapter 3: The Party", duration: 1540 },
        ],
    },
    {
        id: "2",
        title: "Dune",
        author: "Frank Herbert",
        coverUrl: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=400&h=600&fit=crop",
        theme: "dark" as AudiobookTheme,
        chapters: [
            { id: "1", title: "Book One: Dune", duration: 2400 },
            { id: "2", title: "Book Two: Muad'Dib", duration: 2100 },
        ],
    },
    {
        id: "3",
        title: "Walden",
        author: "Henry David Thoreau",
        coverUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=600&fit=crop",
        theme: "forest" as AudiobookTheme,
        chapters: [
            { id: "1", title: "Economy", duration: 3200 },
            { id: "2", title: "Where I Lived", duration: 1800 },
        ],
    },
    {
        id: "4",
        title: "Moby Dick",
        author: "Herman Melville",
        coverUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
        theme: "ocean" as AudiobookTheme,
        chapters: [
            { id: "1", title: "Loomings", duration: 900 },
            { id: "2", title: "The Carpet-Bag", duration: 720 },
            { id: "3", title: "The Spouter-Inn", duration: 1100 },
        ],
    },
]

const THEME_INFO = {
    cream: {
        gradient: "from-amber-100 to-orange-50",
        accent: "bg-amber-600",
        label: "Cream Theme",
        description: "Warm, editorial aesthetic with burnt orange accents",
    },
    dark: {
        gradient: "from-purple-900 to-gray-900",
        accent: "bg-purple-500",
        label: "Dark Theme",
        description: "Sleek dark mode with electric purple accents",
    },
    forest: {
        gradient: "from-emerald-100 to-green-50",
        accent: "bg-emerald-700",
        label: "Forest Theme",
        description: "Calm, nature-inspired with deep emerald tones",
    },
    ocean: {
        gradient: "from-sky-100 to-blue-50",
        accent: "bg-coral-500",
        label: "Ocean Theme",
        description: "Coastal vibes with coral accents",
    },
}

export default function AudiobookDemoPage() {
    const [selectedBook, setSelectedBook] = useState<typeof DEMO_BOOKS[0] | null>(null)
    const [currentTheme, setCurrentTheme] = useState<AudiobookTheme>("cream")

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <Headphones className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                                Audiobook Player
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Component Demo
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                            4 Theme Variants
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                {/* Theme Showcase Section */}
                <section className="mb-16">
                    <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Color Theme Variants
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        Click on any book to open the audiobook player with its associated theme
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {DEMO_BOOKS.map((book, index) => {
                            const themeInfo = THEME_INFO[book.theme]

                            return (
                                <motion.button
                                    key={book.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => {
                                        setSelectedBook(book)
                                        setCurrentTheme(book.theme)
                                    }}
                                    className="group relative rounded-2xl overflow-hidden text-left transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                                >
                                    {/* Background Gradient */}
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br ${themeInfo.gradient} opacity-90`}
                                    />

                                    {/* Content */}
                                    <div className="relative p-5 flex flex-col h-full min-h-[320px]">
                                        {/* Theme Badge */}
                                        <div
                                            className={`self-start px-3 py-1 rounded-full text-xs font-medium text-white ${themeInfo.accent}`}
                                        >
                                            {themeInfo.label}
                                        </div>

                                        {/* Book Cover */}
                                        <div className="flex-1 flex items-center justify-center py-6">
                                            <div className="relative w-28 h-40 rounded-lg overflow-hidden shadow-xl group-hover:shadow-2xl transition-shadow">
                                                <img
                                                    src={book.coverUrl}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                {/* Play overlay */}
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                                        <Play className="w-5 h-5 text-slate-900 ml-0.5" fill="currentColor" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Book Info */}
                                        <div className="space-y-1">
                                            <h3 className="font-serif font-bold text-slate-900 line-clamp-1">
                                                {book.title}
                                            </h3>
                                            <p className="text-sm text-slate-600">{book.author}</p>
                                            <p className="text-xs text-slate-500 mt-2">
                                                {themeInfo.description}
                                            </p>
                                        </div>
                                    </div>
                                </motion.button>
                            )
                        })}
                    </div>
                </section>

                {/* Features Section */}
                <section className="mb-16">
                    <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-8">
                        Component Features
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                title: "Glassmorphism Modal",
                                description:
                                    "Floating modal with frosted glass blur effect and smooth spring animations",
                            },
                            {
                                title: "Waveform Visualization",
                                description:
                                    "Dynamic frequency bar animation that responds to playback progress",
                            },
                            {
                                title: "Theme Switching",
                                description:
                                    "4 beautiful color schemes: Cream, Dark, Forest, and Ocean",
                            },
                            {
                                title: "Audio Controls",
                                description:
                                    "Play/pause, 15s skip forward/back, volume control, and playback speed",
                            },
                            {
                                title: "Editorial Typography",
                                description:
                                    "Serif headers with sans-serif body text for premium feel",
                            },
                            {
                                title: "Soft Neo-Brutalism",
                                description:
                                    "Bold shapes with soft shadows and rounded edges aesthetic",
                            },
                        ].map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.05 }}
                                className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                            >
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Usage Code Section */}
                <section>
                    <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                        Usage Example
                    </h2>

                    <div className="rounded-2xl bg-slate-900 p-6 overflow-x-auto">
                        <pre className="text-sm text-slate-300">
                            <code>{`import { AudiobookPlayer } from "@/components/reader/audiobook-player"

// In your component:
<AudiobookPlayer
  isOpen={isPlayerOpen}
  onClose={() => setIsPlayerOpen(false)}
  book={{
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    coverUrl: "/covers/gatsby.jpg",
    chapters: [
      { id: "1", title: "Chapter 1", duration: 1200 },
    ],
  }}
  audioSrc="/audio/gatsby-ch1.mp3"
  theme="cream" // "cream" | "dark" | "forest" | "ocean"
  onThemeChange={(theme) => console.log(theme)}
/>`}</code>
                        </pre>
                    </div>
                </section>
            </main>

            {/* Audiobook Player Modal */}
            {selectedBook && (
                <AudiobookPlayer
                    isOpen={!!selectedBook}
                    onClose={() => setSelectedBook(null)}
                    book={selectedBook}
                    theme={currentTheme}
                    onThemeChange={setCurrentTheme}
                />
            )}
        </div>
    )
}
