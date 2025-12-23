"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, FileText, Image, Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react"
import type { Book, TranscriptionProgress, PageContent } from "@/lib/types"
import { transcribePdf } from "@/lib/pdf-transcription"
import {
    uploadBookImage,
    updateTranscriptionStatus,
    savePageContent,
} from "@/lib/actions/transcription"

interface TranscriptionModalProps {
    book: Book
    isOpen: boolean
    onClose: () => void
    onComplete: () => void
}

export function TranscriptionModal({
    book,
    isOpen,
    onClose,
    onComplete,
}: TranscriptionModalProps) {
    const [status, setStatus] = useState<"idle" | "processing" | "completed" | "error">("idle")
    const [progress, setProgress] = useState(0)
    const [currentPage, setCurrentPage] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState({ textBlocks: 0, images: 0 })

    const startTranscription = useCallback(async () => {
        if (!book.pdf_url) {
            setError("No PDF file found for this book")
            setStatus("error")
            return
        }

        setStatus("processing")
        setProgress(0)
        setCurrentPage(0)
        setError(null)

        try {
            // Update status in database
            await updateTranscriptionStatus(book.id, "processing", 0)

            let totalTextBlocks = 0
            let totalImages = 0

            // Image upload wrapper
            const uploadImage = async (
                imageData: string,
                bookId: string,
                pageNumber: number,
                index: number
            ) => {
                const url = await uploadBookImage(imageData, bookId, pageNumber, index)
                if (url) totalImages++
                return url
            }

            // Start transcription with progress tracking
            const pages = await transcribePdf(
                book.pdf_url,
                book.id,
                {
                    extractImages: true,
                    preserveLayout: true,
                    onProgress: async (p: TranscriptionProgress) => {
                        setCurrentPage(p.currentPage)
                        setProgress(Math.round((p.currentPage / p.totalPages) * 100))

                        // Update database progress periodically (every 5 pages)
                        if (p.currentPage % 5 === 0 || p.currentPage === p.totalPages) {
                            await updateTranscriptionStatus(
                                book.id,
                                "processing",
                                Math.round((p.currentPage / p.totalPages) * 100)
                            )
                        }
                    },
                },
                uploadImage
            )

            // Save each page to database
            for (const page of pages) {
                await savePageContent(book.id, page)
                totalTextBlocks += page.blocks.filter(b => b.type !== "image").length
            }

            setStats({ textBlocks: totalTextBlocks, images: totalImages })

            // Mark as completed
            await updateTranscriptionStatus(book.id, "completed", 100)
            setStatus("completed")
            setProgress(100)

            // Wait a moment before closing
            setTimeout(() => {
                onComplete()
            }, 2000)
        } catch (err: any) {
            console.error("Transcription error:", err)
            setError(err.message || "An error occurred during transcription")
            setStatus("error")
            await updateTranscriptionStatus(book.id, "failed", 0)
        }
    }, [book, onComplete])

    // Auto-start transcription when modal opens
    useEffect(() => {
        if (isOpen && status === "idle") {
            startTranscription()
        }
    }, [isOpen, status, startTranscription])

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setStatus("idle")
            setProgress(0)
            setCurrentPage(0)
            setError(null)
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={status === "completed" || status === "error" ? onClose : undefined}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-md mx-4 overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-zinc-900 dark:text-white">
                                    Transcribing Book
                                </h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {book.title}
                                </p>
                            </div>
                        </div>
                        {(status === "completed" || status === "error") && (
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="px-6 py-8">
                        {status === "processing" && (
                            <div className="space-y-6">
                                <div className="flex justify-center">
                                    <div className="relative">
                                        <Loader2 className="h-16 w-16 animate-spin text-amber-500" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-sm font-bold text-amber-600">{progress}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-600 dark:text-zinc-400">
                                            Processing page {currentPage} of {book.total_pages}
                                        </span>
                                        <span className="font-medium text-amber-600">{progress}%</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-center gap-8 text-center">
                                    <div>
                                        <div className="flex items-center justify-center gap-1 text-zinc-600 dark:text-zinc-400">
                                            <FileText size={16} />
                                            <span className="text-lg font-semibold">{stats.textBlocks}</span>
                                        </div>
                                        <span className="text-xs text-zinc-500">Text blocks</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-center gap-1 text-zinc-600 dark:text-zinc-400">
                                            <Image size={16} />
                                            <span className="text-lg font-semibold">{stats.images}</span>
                                        </div>
                                        <span className="text-xs text-zinc-500">Images</span>
                                    </div>
                                </div>

                                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                                    Extracting text and images from your PDF...
                                    <br />
                                    <span className="text-xs">This may take a few minutes for large books.</span>
                                </p>
                            </div>
                        )}

                        {status === "completed" && (
                            <div className="space-y-4 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", damping: 15 }}
                                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
                                >
                                    <CheckCircle className="h-10 w-10 text-green-500" />
                                </motion.div>
                                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                                    Transcription Complete!
                                </h3>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    Successfully extracted <strong>{stats.textBlocks}</strong> text blocks
                                    {stats.images > 0 && (
                                        <> and <strong>{stats.images}</strong> images</>
                                    )}
                                    .
                                </p>
                                <p className="text-sm text-zinc-500">
                                    You can now read with enhanced text formatting.
                                </p>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="space-y-4 text-center">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                    <AlertCircle className="h-10 w-10 text-red-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                                    Transcription Failed
                                </h3>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    {error || "An unexpected error occurred."}
                                </p>
                                <button
                                    onClick={() => {
                                        setStatus("idle")
                                        startTranscription()
                                    }}
                                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {status === "processing" && (
                        <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
                            <p className="text-center text-xs text-zinc-400">
                                Don't close this window while transcription is in progress
                            </p>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
