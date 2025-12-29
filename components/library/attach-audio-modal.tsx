"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    X,
    Upload,
    Loader2,
    Check,
    Headphones,
    Link2,
    Music,
    AlertCircle,
    ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Book } from "@/lib/types"
import {
    isAudioFile,
    extractAudioMetadata,
    formatDuration,
    isValidAudioUrl,
    getAudioDurationFromUrl,
    type AudioMetadata
} from "@/lib/audio-utils"

interface AttachAudioModalProps {
    isOpen: boolean
    onClose: () => void
    book: Book | null
    onAttachFile: (book: Book, audioUrl: string, duration: number, coverUrl?: string) => Promise<void>
    onAttachLink: (book: Book, audioUrl: string, duration: number) => Promise<void>
}

type TabType = "upload" | "link"

export function AttachAudioModal({
    isOpen,
    onClose,
    book,
    onAttachFile,
    onAttachLink,
}: AttachAudioModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>("upload")
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Audio metadata preview
    const [audioMetadata, setAudioMetadata] = useState<AudioMetadata | null>(null)
    const [audioFile, setAudioFile] = useState<File | null>(null)

    // External link form
    const [externalUrl, setExternalUrl] = useState("")
    const [externalDuration, setExternalDuration] = useState(0)
    const [isValidatingUrl, setIsValidatingUrl] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const resetState = useCallback(() => {
        setActiveTab("upload")
        setAudioMetadata(null)
        setAudioFile(null)
        setExternalUrl("")
        setExternalDuration(0)
        setError(null)
        setIsProcessing(false)
        setIsSuccess(false)
    }, [])

    const handleClose = useCallback(() => {
        resetState()
        onClose()
    }, [resetState, onClose])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        setError(null)

        const file = e.dataTransfer.files[0]
        if (file && isAudioFile(file)) {
            await processAudioFile(file)
        } else {
            setError("Please drop a valid audio file (MP3, M4B, WAV)")
        }
    }, [])

    const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && isAudioFile(file)) {
            await processAudioFile(file)
        }
    }, [])

    const processAudioFile = async (file: File) => {
        setIsProcessing(true)
        setError(null)
        try {
            const metadata = await extractAudioMetadata(file)
            setAudioMetadata(metadata)
            setAudioFile(file)
        } catch (err) {
            setError("Failed to read audio file.")
            console.error(err)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleConfirmUpload = async () => {
        if (!book || !audioFile || !audioMetadata) return

        setIsProcessing(true)
        try {
            // Upload audio file and get URL (handled by parent)
            // For now, we'll pass the File to the handler
            const { uploadAudioFile, uploadAudioCover } = await import("@/lib/audio-storage")
            const { useAuth } = await import("@/lib/hooks/use-auth")

            // Get user ID from auth context - this is a simplified version
            // In reality, we'd get this from context
            const audioUrl = await uploadAudioFile(audioFile, book.user_id)

            if (!audioUrl) {
                throw new Error("Failed to upload audio file")
            }

            // Upload cover if extracted
            let coverUrl: string | undefined
            if (audioMetadata.coverBlob) {
                coverUrl = await uploadAudioCover(audioMetadata.coverBlob, book.user_id, book.title) || undefined
            }

            await onAttachFile(book, audioUrl, audioMetadata.duration, coverUrl)

            setIsSuccess(true)
            setTimeout(handleClose, 1500)
        } catch (err) {
            setError("Failed to attach audio file.")
            setIsProcessing(false)
        }
    }

    const handleValidateUrl = async () => {
        if (!externalUrl.trim()) return

        setIsValidatingUrl(true)
        setError(null)

        try {
            if (!isValidAudioUrl(externalUrl)) {
                setError("Please enter a valid audio URL.")
                setIsValidatingUrl(false)
                return
            }

            const duration = await getAudioDurationFromUrl(externalUrl)
            setExternalDuration(duration)
        } catch (err) {
            setError("Could not validate URL.")
        } finally {
            setIsValidatingUrl(false)
        }
    }

    const handleConfirmLink = async () => {
        if (!book || !externalUrl) return

        setIsProcessing(true)
        try {
            await onAttachLink(book, externalUrl, externalDuration)
            setIsSuccess(true)
            setTimeout(handleClose, 1500)
        } catch (err) {
            setError("Failed to attach audio link.")
            setIsProcessing(false)
        }
    }

    if (!book) return null

    const tabs = [
        { id: "upload" as const, label: "Upload File", icon: Upload },
        { id: "link" as const, label: "External Link", icon: Link2 },
    ]

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isProcessing ? handleClose : undefined}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b px-6 py-4 dark:border-zinc-800">
                                <h2 className="font-serif text-lg font-medium">Attach Audio</h2>
                                {!isProcessing && (
                                    <button
                                        onClick={handleClose}
                                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>

                            {/* Book Preview */}
                            <div className="flex items-center gap-3 border-b px-6 py-3 bg-slate-50 dark:bg-zinc-800/50 dark:border-zinc-800">
                                <div className="h-12 w-9 overflow-hidden rounded bg-slate-200">
                                    {book.cover_url && (
                                        <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm truncate">{book.title}</p>
                                    <p className="text-xs text-slate-500 truncate">{book.author}</p>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b dark:border-zinc-800">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id)
                                            setError(null)
                                            setAudioMetadata(null)
                                        }}
                                        disabled={isProcessing}
                                        className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                                ? "border-b-2 border-amber-500 text-amber-600"
                                                : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        <tab.icon size={16} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <AnimatePresence mode="wait">
                                    {/* Upload Tab */}
                                    {activeTab === "upload" && (
                                        <motion.div
                                            key="upload"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                        >
                                            {!audioMetadata ? (
                                                <div
                                                    onDragOver={!isProcessing ? handleDragOver : undefined}
                                                    onDragLeave={!isProcessing ? handleDragLeave : undefined}
                                                    onDrop={!isProcessing ? handleDrop : undefined}
                                                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                                                    className={`flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${isDragging
                                                            ? "border-amber-500 bg-amber-50"
                                                            : "border-slate-200 hover:border-amber-500/50"
                                                        } ${isProcessing ? "pointer-events-none" : ""}`}
                                                >
                                                    {isProcessing ? (
                                                        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                                                    ) : (
                                                        <>
                                                            <Music className="h-8 w-8 text-slate-400 mb-3" />
                                                            <p className="text-sm font-medium">Drop audio file here</p>
                                                            <p className="text-xs text-slate-400 mt-1">MP3, M4B, WAV</p>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-zinc-800">
                                                        <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                                                            {audioMetadata.coverUrl ? (
                                                                <img src={audioMetadata.coverUrl} alt="" className="h-full w-full rounded-lg object-cover" />
                                                            ) : (
                                                                <Headphones className="h-6 w-6 text-amber-600" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">{audioMetadata.title}</p>
                                                            <p className="text-xs text-slate-500">
                                                                {formatDuration(audioMetadata.duration)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" className="flex-1" onClick={() => setAudioMetadata(null)}>
                                                            Cancel
                                                        </Button>
                                                        <Button className="flex-1" onClick={handleConfirmUpload} disabled={isProcessing}>
                                                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Attach"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Link Tab */}
                                    {activeTab === "link" && (
                                        <motion.div
                                            key="link"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-4"
                                        >
                                            <div>
                                                <label className="text-sm font-medium mb-1.5 block">Audio URL</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="url"
                                                        value={externalUrl}
                                                        onChange={(e) => setExternalUrl(e.target.value)}
                                                        placeholder="https://..."
                                                        className="flex-1 rounded-lg border px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                                                    />
                                                    <Button variant="outline" size="sm" onClick={handleValidateUrl} disabled={isValidatingUrl}>
                                                        {isValidatingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
                                                    </Button>
                                                </div>
                                            </div>

                                            {externalDuration > 0 && (
                                                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                                                    <Check size={16} />
                                                    <span>Duration: {formatDuration(externalDuration)}</span>
                                                </div>
                                            )}

                                            <Button className="w-full" onClick={handleConfirmLink} disabled={isProcessing || !externalUrl}>
                                                {isProcessing ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <ExternalLink className="mr-2 h-4 w-4" />
                                                        Attach Link
                                                    </>
                                                )}
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Error */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                                    >
                                        <AlertCircle size={16} />
                                        {error}
                                    </motion.div>
                                )}

                                {/* Success */}
                                {isSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"
                                    >
                                        <Check size={16} />
                                        Audio attached successfully!
                                    </motion.div>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".mp3,.m4a,.m4b,.wav"
                                    onChange={handleFileInput}
                                    className="hidden"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
