"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
    ArrowLeft,
    BookOpen,
    Clock,
    FileText,
    Tag,
    Users,
    ChevronDown,
    ChevronUp,
    Check,
    Bell,
    List,
    X,
} from "lucide-react"
import type { Book } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BookIntroductionProps {
    book: Book
    onStartReading: () => void
    onClose: () => void
    allBooks: Book[]
}

const SPRING = { stiffness: 400, damping: 30, mass: 0.8 }

// Estimate reading time (2 min per page average)
function estimateReadingTime(pages: number): string {
    const minutes = Math.ceil(pages * 2)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    return `${hours}h ${remainingMins}m`
}

// Parse categories from genre string
function parseCategories(genre: string | undefined): string[] {
    if (!genre) return []
    return genre.split(",").map((s) => s.trim()).filter(Boolean)
}

// Generate learning points based on category
function generateLearningPoints(book: Book): string[] {
    const categories = parseCategories(book.genre)
    const defaultPoints = [
        "Gain comprehensive understanding of the subject matter",
        "Learn practical techniques you can apply immediately",
        "Develop deeper insights and critical thinking skills",
        "Build foundational knowledge for further study",
    ]

    if (categories.some((c) => c.toLowerCase().includes("technical"))) {
        return [
            "Master core programming concepts and best practices",
            "Understand system architecture and design patterns",
            "Learn debugging and optimization techniques",
            "Build real-world projects step by step",
        ]
    }
    if (categories.some((c) => c.toLowerCase().includes("philosophy"))) {
        return [
            "Explore fundamental philosophical questions",
            "Understand different schools of thought",
            "Develop critical reasoning and argumentation skills",
            "Apply philosophical concepts to everyday life",
        ]
    }
    if (categories.some((c) => c.toLowerCase().includes("history"))) {
        return [
            "Understand key historical events and their causes",
            "Analyze patterns and trends across time periods",
            "Learn from the successes and failures of the past",
            "Develop a broader perspective on current events",
        ]
    }

    return defaultPoints
}

// Generate target audience based on category
function generateTargetAudience(book: Book): string {
    const categories = parseCategories(book.genre)

    if (categories.some((c) => c.toLowerCase().includes("technical"))) {
        return "Developers, engineers, and technical professionals looking to expand their skills."
    }
    if (categories.some((c) => c.toLowerCase().includes("philosophy"))) {
        return "Curious minds, students, and anyone interested in exploring life's big questions."
    }
    if (categories.some((c) => c.toLowerCase().includes("history"))) {
        return "History enthusiasts, students, and anyone seeking to understand the past."
    }

    return "Anyone interested in expanding their knowledge and exploring new ideas."
}

export function BookIntroduction({
    book,
    onStartReading,
    onClose,
    allBooks,
}: BookIntroductionProps) {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
    const [isTocOpen, setIsTocOpen] = useState(false)
    const [activeSection, setActiveSection] = useState(0)
    const contentRef = useRef<HTMLDivElement>(null)

    const coverUrl = book.cover_url ?? "/placeholder.svg"
    const categories = parseCategories(book.genre)
    const learningPoints = generateLearningPoints(book)
    const targetAudience = generateTargetAudience(book)
    const readingTime = estimateReadingTime(book.total_pages)
    const progress = book.total_pages > 0 ? Math.round((book.current_page / book.total_pages) * 100) : 0
    const hasStarted = book.current_page > 0

    // Get similar books (same category, excluding current book)
    const similarBooks = useMemo(() => {
        return allBooks
            .filter((b) => b.id !== book.id)
            .filter((b) => {
                const bookCats = parseCategories(b.genre)
                return categories.some((c) => bookCats.some((bc) => bc.toLowerCase() === c.toLowerCase()))
            })
            .slice(0, 4)
    }, [allBooks, book.id, categories])

    // Table of Contents sections
    const tocSections = [
        "Overview",
        "What You'll Learn",
        "Who This Book Is For",
        "Similar Books",
    ]

    // Scroll tracking for TOC highlighting
    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current) return
            const sections = contentRef.current.querySelectorAll("[data-section]")
            let newActiveSection = 0

            sections.forEach((section, index) => {
                const rect = section.getBoundingClientRect()
                if (rect.top <= 200) {
                    newActiveSection = index
                }
            })

            setActiveSection(newActiveSection)
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // Scroll to section
    const scrollToSection = (index: number) => {
        const section = contentRef.current?.querySelectorAll("[data-section]")[index]
        if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        setIsTocOpen(false)
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background overflow-y-auto"
        >
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm font-medium">Back to Library</span>
                    </button>

                    {/* Mobile TOC Toggle */}
                    <button
                        onClick={() => setIsTocOpen(true)}
                        className="lg:hidden flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="flex gap-12">
                    {/* Main Column (70%) */}
                    <div ref={contentRef} className="flex-1 lg:max-w-[70%]">
                        {/* Hero Section */}
                        <section data-section className="mb-12">
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Book Cover */}
                                <motion.div
                                    layoutId={`book-cover-${book.id}`}
                                    className="flex-shrink-0 mx-auto md:mx-0"
                                    transition={{ type: "spring", ...SPRING }}
                                >
                                    <div className="relative w-48 md:w-56 aspect-[7/10] rounded-xl overflow-hidden shadow-2xl">
                                        <Image
                                            src={coverUrl}
                                            alt={book.title}
                                            fill
                                            className="object-cover"
                                            sizes="224px"
                                            priority
                                        />
                                        {/* Spine effect */}
                                        <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/20 to-transparent" />
                                    </div>
                                </motion.div>

                                {/* Book Info */}
                                <div className="flex-1 text-center md:text-left">
                                    {/* Category Badge */}
                                    {categories.length > 0 && (
                                        <div className="flex flex-wrap gap-6 justify-center md:justify-start mb-3">
                                            {categories.slice(0, 2).map((cat, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300"
                                                >
                                                    <Tag className="h-36 w-36" />
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Title */}
                                    <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6">
                                        {book.title}
                                    </h1>

                                    {/* Author */}
                                    <p className="text-lg text-muted-foreground mb-6">
                                        by <span className="text-primary font-medium">{book.author}</span>
                                    </p>

                                    {/* Metadata Row */}
                                    <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start text-sm text-muted-foreground mb-6">
                                        <div className="flex items-center gap-1.5">
                                            <FileText className="h-4 w-4" />
                                            <span>{book.total_pages} pages</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-4 w-4" />
                                            <span>{readingTime}</span>
                                        </div>
                                        {hasStarted && (
                                            <div className="flex items-center gap-1.5">
                                                <BookOpen className="h-4 w-4" />
                                                <span>{progress}% complete</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress Bar (if started) */}
                                    {hasStarted && (
                                        <div className="w-full max-w-xs mx-auto md:mx-0 mb-6">
                                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                                                />
                                            </div>
                                            <p className="mt-1.5 text-xs text-muted-foreground">
                                                Page {book.current_page} of {book.total_pages}
                                            </p>
                                        </div>
                                    )}

                                    {/* CTAs */}
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                                        <Button
                                            onClick={onStartReading}
                                            size="lg"
                                            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg shadow-amber-500/20"
                                        >
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            {hasStarted ? "Continue Reading" : "Start Reading"}
                                        </Button>
                                        <Button variant="outline" size="lg">
                                            <Bell className="h-4 w-4 mr-2" />
                                            Schedule Reminder
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Book Description */}
                        <section data-section className="mb-10">
                            <h2 className="text-xl font-semibold mb-4">About This Book</h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p
                                    className={cn(
                                        "text-muted-foreground leading-relaxed",
                                        !isDescriptionExpanded && "line-clamp-4"
                                    )}
                                >
                                    {book.description ||
                                        `Dive into "${book.title}" by ${book.author}. This comprehensive work offers valuable insights and knowledge that will expand your understanding and perspective. Whether you're a beginner or looking to deepen your expertise, this book provides a thorough exploration of its subject matter with clarity and depth.`}
                                </p>
                                {(book.description?.length || 200) > 200 && (
                                    <button
                                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                        className="flex items-center gap-1 text-primary font-medium mt-2 hover:underline"
                                    >
                                        {isDescriptionExpanded ? (
                                            <>
                                                Show Less <ChevronUp className="h-4 w-4" />
                                            </>
                                        ) : (
                                            <>
                                                Read More <ChevronDown className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </section>

                        {/* What You'll Learn */}
                        <section data-section className="mb-10">
                            <h2 className="text-xl font-semibold mb-4">What You'll Learn</h2>
                            <ul className="space-y-3">
                                {learningPoints.map((point, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-start gap-3"
                                    >
                                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                        </div>
                                        <span className="text-muted-foreground">{point}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </section>

                        {/* Who This Book Is For */}
                        <section data-section className="mb-10">
                            <h2 className="text-xl font-semibold mb-4">Who This Book Is For</h2>
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                <p className="text-muted-foreground">{targetAudience}</p>
                            </div>
                        </section>

                        {/* Similar Books */}
                        {similarBooks.length > 0 && (
                            <section data-section className="mb-10">
                                <h2 className="text-xl font-semibold mb-4">You Might Also Like</h2>
                                <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
                                    {similarBooks.map((similarBook) => (
                                        <motion.div
                                            key={similarBook.id}
                                            whileHover={{ scale: 1.02 }}
                                            className="flex-shrink-0 w-36 cursor-pointer"
                                        >
                                            <div className="relative aspect-[7/10] rounded-lg overflow-hidden shadow-lg mb-2">
                                                <Image
                                                    src={similarBook.cover_url ?? "/placeholder.svg"}
                                                    alt={similarBook.title}
                                                    fill
                                                    className="object-cover"
                                                    sizes="144px"
                                                />
                                            </div>
                                            <h3 className="font-medium text-sm line-clamp-2">{similarBook.title}</h3>
                                            <p className="text-xs text-muted-foreground truncate">{similarBook.author}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar - Table of Contents (Desktop) */}
                    <aside className="hidden lg:block w-[280px] flex-shrink-0">
                        <div className="sticky top-24">
                            <div className="border border-border rounded-xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold">{book.title}</h3>
                                </div>
                                <p className="text-sm text-primary mb-4">by {book.author}</p>

                                <nav className="space-y-1">
                                    {tocSections.map((section, i) => (
                                        <button
                                            key={section}
                                            onClick={() => scrollToSection(i)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                                                activeSection === i
                                                    ? "bg-primary/10 text-primary font-medium"
                                                    : "text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            {section}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Mobile TOC Drawer */}
            <AnimatePresence>
                {isTocOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsTocOpen(false)}
                            className="fixed inset-0 z-50 bg-black/40"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl border-t border-border p-6 max-h-[60vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Contents</h3>
                                <button onClick={() => setIsTocOpen(false)}>
                                    <X className="h-5 w-5 text-muted-foreground" />
                                </button>
                            </div>
                            <nav className="space-y-1">
                                {tocSections.map((section, i) => (
                                    <button
                                        key={section}
                                        onClick={() => scrollToSection(i)}
                                        className={cn(
                                            "w-full text-left px-3 py-3 rounded-lg text-sm transition-colors",
                                            activeSection === i
                                                ? "bg-primary/10 text-primary font-medium"
                                                : "text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        {section}
                                    </button>
                                ))}
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile Sticky CTA */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border z-40">
                <Button
                    onClick={onStartReading}
                    size="lg"
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold"
                >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {hasStarted ? "Continue Reading" : "Start Reading"}
                </Button>
            </div>
        </motion.div>
    )
}
