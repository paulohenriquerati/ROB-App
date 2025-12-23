"use client"

import { motion, AnimatePresence } from "framer-motion"
import { type Book, type ReaderSettings } from "@/lib/types"
import { PdfPage } from "./pdf-page"
import { useState, useEffect } from "react"

interface BookSpreadProps {
    currentPage: number
    direction: number
    book: Book
    settings: ReaderSettings
}

export function BookSpread({ currentPage, direction, book, settings }: BookSpreadProps) {
    const [pdfFailed, setPdfFailed] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const getPageStyles = () => {
        if (settings.theme === "sepia") return "bg-[#F4ECD8] text-[#433422] border-[#E8DCC0]"
        if (settings.theme === "dark") return "bg-[#202022] text-[#E4E4E7] border-[#2A2A2D]"
        if (settings.theme === "night") return "bg-[#0a0a0a] text-[#a3a3a3] border-[#1f1f1f]"
        return "bg-[#FAFAF9] text-slate-900 border-slate-200"
    }

    const getSpineStyles = () => {
        if (settings.theme === "dark" || settings.theme === "night")
            return "from-black/80 via-black/40 to-black/80 mix-blend-multiply"
        return "from-black/5 via-black/20 to-black/5 mix-blend-multiply"
    }

    const getPageContent = (page: number) => {
        // If we have a PDF URL and it hasn't failed, render the PDF page
        if ((book.pdf_url || (book as any).pdfUrl) && !pdfFailed) {
            // PDF pages are 1-based, matching our page number
            return (
                <div className="flex h-full w-full items-center justify-center">
                    <PdfPage
                        pdfUrl={book.pdf_url || (book as any).pdfUrl}
                        pageNumber={page}
                        className="h-full w-full"
                        onError={() => setPdfFailed(true)}
                    />
                </div>
            )
        }

        const isChapterStart = page === 1 || page % 15 === 0

        if (page === 1) {
            return (
                <div className="flex h-full flex-col items-center justify-center p-12 text-center">
                    <h1
                        className={`font-serif text-4xl mb-4 ${settings.theme === "dark" ? "text-white" : "text-slate-900"}`}
                    >
                        {book.title}
                    </h1>
                    <div
                        className={`w-16 h-1 mb-8 opacity-20 ${settings.theme === "dark" ? "bg-white" : "bg-slate-900"}`}
                    ></div>
                    <p
                        className={`text-sm font-medium uppercase tracking-widest ${settings.theme === "dark" ? "text-zinc-400" : "text-slate-500"}`}
                    >
                        {book.author}
                    </p>
                </div>
            )
        }

        const paragraphs = [
            "Architecture is a visual art, and the buildings speak for themselves. The lines between form and function blur when true design takes hold.",
            "Design is not just what it looks like and feels like. Design is how it works. A simple curve can dictate the flow of an entire room.",
            "We shape our buildings; thereafter they shape us. The environment we inhabit reflects the chaos or calm of our inner minds.",
            "Simplicity is the ultimate sophistication. To remove the unnecessary is to reveal the essential truth of the object.",
            "An empty room is a story waiting to happen, and you are the author. Light fills the void, creating shadows that dance with time.",
            "The details are not the details. They make the design. Texture, weight, temperature—these invisible forces guide our hand.",
        ]

        // Deterministic content generation
        const p1 = paragraphs[(page * 7) % paragraphs.length]
        const p2 = paragraphs[(page * 3) % paragraphs.length]
        const p3 = paragraphs[(page + 4) % paragraphs.length]

        const fontSizeMultiplier =
            settings.fontSize === "small"
                ? 0.8
                : settings.fontSize === "medium"
                    ? 1
                    : settings.fontSize === "large"
                        ? 1.2
                        : 1.5

        const fontClass =
            settings.fontFamily === "serif"
                ? "font-serif"
                : settings.fontFamily === "sans"
                    ? "font-sans"
                    : "font-mono"

        const lineHeightClass =
            settings.lineHeight === "tight"
                ? "leading-snug"
                : settings.lineHeight === "relaxed"
                    ? "leading-loose"
                    : "leading-relaxed"

        const marginClass =
            settings.margins === "narrow"
                ? "p-6 md:p-8"
                : settings.margins === "wide"
                    ? "p-10 md:p-14 lg:p-16"
                    : "p-8 md:p-10 lg:p-12"

        return (
            <div
                className={`flex h-full flex-col overflow-hidden text-justify ${marginClass} ${settings.theme === "dark" || settings.theme === "night" ? "selection:bg-blue-500/30" : "selection:bg-blue-100"}`}
                style={{ fontSize: `${fontSizeMultiplier}rem` }}
            >
                <span
                    className={`mx-auto mb-6 text-[10px] font-bold uppercase tracking-widest opacity-40 ${settings.theme === "dark" ? "text-white" : "text-black"}`}
                >
                    {page}
                </span>

                {isChapterStart && (
                    <h3
                        className={`mb-6 text-center font-serif text-2xl ${settings.theme === "dark" ? "text-white" : "text-slate-900"}`}
                    >
                        Chapter {Math.ceil(page / 15)}
                    </h3>
                )}

                <p
                    className={`mb-6 ${fontClass} ${lineHeightClass} ${isChapterStart ? "first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-5xl first-letter:font-bold" : ""}`}
                >
                    {p1}
                </p>
                <p className={`mb-6 ${fontClass} ${lineHeightClass}`}>
                    {p2} The quick brown fox jumps over the lazy dog. The beauty of the structure lies in its foundation, much like
                    knowledge builds upon the basics of understanding.
                </p>
                {!isChapterStart && <p className={`${fontClass} ${lineHeightClass}`}>{p3}</p>}
            </div>
        )
    }

    const pageVariants = {
        enter: (d: number) => ({
            rotateY: d > 0 ? -90 : 90,
            opacity: 0,
            transformOrigin: d > 0 ? "left center" : "right center",
            boxShadow: d > 0 ? "inset 20px 0 50px -10px rgba(0,0,0,0.2)" : "inset -20px 0 50px -10px rgba(0,0,0,0.2)",
        }),
        center: {
            rotateY: 0,
            opacity: 1,
            boxShadow: "inset 0 0 0 0 rgba(0,0,0,0)",
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
        },
        exit: (d: number) => ({
            rotateY: d > 0 ? -15 : 15,
            opacity: 0,
            scale: 0.98,
            boxShadow: d > 0 ? "inset 10px 0 20px -10px rgba(0,0,0,0.1)" : "inset -10px 0 20px -10px rgba(0,0,0,0.1)",
            transition: { duration: 0.4 },
        }),
    }

    return (
        <div
            className={`relative flex w-full max-w-5xl bg-transparent shadow-2xl transition-all duration-500 rounded-sm ${isMobile ? 'aspect-[2/3]' : 'aspect-[3/2]'}`}
            style={{ filter: `brightness(${settings.brightness}%)` }}
        >
            {/* Spine Shadow - hidden on mobile */}
            {!isMobile && (
                <div
                    className={`pointer-events-none absolute bottom-0 left-1/2 top-0 z-30 w-12 -translate-x-1/2 bg-gradient-to-r blur-sm ${getSpineStyles()}`}
                />
            )}

            {/* Left Page - hidden on mobile */}
            {!isMobile && (
                <div
                    className={`relative flex-1 overflow-hidden border-r transition-colors duration-500 rounded-l-sm ${getPageStyles()}`}
                >
                    <div
                        className={`pointer-events-none absolute inset-0 z-10 bg-gradient-to-r ${settings.theme === "dark" ? "from-black/40 to-transparent" : "from-black/5 to-transparent"}`}
                    />
                    {/* Left page shows the even-numbered page of the current spread */}
                    {(() => {
                        // Calculate left page: if currentPage is odd, left = currentPage - 1 (could be 0)
                        // if currentPage is even, left = currentPage - 1 (the odd page before it)
                        const spreadBase = Math.floor((currentPage - 1) / 2) * 2
                        const leftPage = spreadBase // Even pages on left (0, 2, 4...)
                        return leftPage > 0 ? getPageContent(leftPage) : (
                            <div className="flex h-full items-center justify-center">
                                <span className="text-xs opacity-30">Inside Cover</span>
                            </div>
                        )
                    })()}
                </div>
            )}

            {/* Right Page (or single page on mobile) */}
            <div
                className={`relative flex-1 overflow-hidden transition-colors duration-500 ${isMobile ? 'rounded-sm' : 'border-l rounded-r-sm'} ${getPageStyles()}`}
            >
                <div
                    className={`pointer-events-none absolute inset-0 z-10 bg-gradient-to-l ${settings.theme === "dark" ? "from-black/40 to-transparent" : "from-black/5 to-transparent"}`}
                />

                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                        key={currentPage}
                        custom={direction}
                        variants={pageVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className={`absolute inset-0 backface-hidden preserve-3d transition-colors duration-500 ${getPageStyles()}`}
                        style={{ backfaceVisibility: "hidden", transformStyle: "preserve-3d" }}
                    >
                        {/* Right page shows the odd-numbered page of the current spread, or current page on mobile */}
                        {(() => {
                            if (isMobile) {
                                return getPageContent(currentPage)
                            }
                            const spreadBase = Math.floor((currentPage - 1) / 2) * 2
                            const rightPage = spreadBase + 1 // Odd pages on right (1, 3, 5...)
                            return getPageContent(rightPage)
                        })()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
