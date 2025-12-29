"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    X,
    Upload,
    FileText,
    Loader2,
    Check,
    Headphones,
    Link2,
    Music,
    ExternalLink,
    AlertCircle,
    Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    isAudioFile,
    isPdfFile,
    isAaxFile,
    extractAudioMetadata,
    formatDuration,
    isValidAudioUrl,
    getAudioDurationFromUrl,
    type AudioMetadata
} from "@/lib/audio-utils"

interface AddBookModalProps {
    isOpen: boolean
    onClose: () => void
    onUpload: (files: FileList) => Promise<void>
    onAddAudiobook?: (metadata: AudioMetadata, file: File) => Promise<void>
    onAddExternalAudio?: (url: string, title: string, author: string, duration: number) => Promise<void>
}

type TabType = "pdf" | "audio" | "link"

export function AddBookModal({
    isOpen,
    onClose,
    onUpload,
    onAddAudiobook,
    onAddExternalAudio
}: AddBookModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>("pdf")
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Audio metadata preview
    const [audioMetadata, setAudioMetadata] = useState<AudioMetadata | null>(null)
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [isAaxUpload, setIsAaxUpload] = useState(false)

    // External link form
    const [externalUrl, setExternalUrl] = useState("")
    const [externalTitle, setExternalTitle] = useState("")
    const [externalAuthor, setExternalAuthor] = useState("")
    const [externalDuration, setExternalDuration] = useState(0)
    const [isValidatingUrl, setIsValidatingUrl] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setActiveTab("pdf")
            setAudioMetadata(null)
            setAudioFile(null)
            setIsAaxUpload(false)
            setExternalUrl("")
            setExternalTitle("")
            setExternalAuthor("")
            setExternalDuration(0)
            setError(null)
            setIsProcessing(false)
            setIsSuccess(false)
        }
    }, [isOpen])

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

        const files = e.dataTransfer.files
        if (files.length > 0) {
            await processFiles(files)
        }
    }, [])

    const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            await processFiles(files)
        }
    }, [])

    const processFiles = async (files: FileList) => {
        setError(null)
        const file = files[0]

        // Smart detection: switch tab based on file type
        if (isAudioFile(file)) {
            setActiveTab("audio")
            setIsAaxUpload(isAaxFile(file))
            await processAudioFile(file)
        } else if (isPdfFile(file)) {
            setActiveTab("pdf")
            await processPdfFile(files)
        } else {
            setError("Unsupported file type. Please upload PDF or audio files (MP3, M4B, AAX, WAV).")
        }
    }

    const processAudioFile = async (file: File) => {
        setIsProcessing(true)
        try {
            const metadata = await extractAudioMetadata(file)
            setAudioMetadata(metadata)
            setAudioFile(file)
        } catch (err) {
            setError("Failed to read audio file metadata.")
            console.error(err)
        } finally {
            setIsProcessing(false)
        }
    }

    const processPdfFile = async (files: FileList) => {
        setIsProcessing(true)
        try {
            await onUpload(files)
            setIsSuccess(true)
            setTimeout(() => {
                setIsSuccess(false)
                setIsProcessing(false)
                onClose()
            }, 1500)
        } catch (err) {
            setError("Failed to upload PDF file.")
            setIsProcessing(false)
        }
    }

    const handleConfirmAudioUpload = async () => {
        if (!audioFile || !audioMetadata || !onAddAudiobook) return

        setIsProcessing(true)
        try {
            await onAddAudiobook(audioMetadata, audioFile)
            setIsSuccess(true)
            setTimeout(() => {
                setIsSuccess(false)
                setIsProcessing(false)
                onClose()
            }, 1500)
        } catch (err) {
            setError("Failed to upload audiobook.")
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
                return
            }

            // Try to get duration
            const duration = await getAudioDurationFromUrl(externalUrl)
            setExternalDuration(duration)
        } catch (err) {
            setError("Could not validate URL. Please check the link.")
        } finally {
            setIsValidatingUrl(false)
        }
    }

    const handleConfirmExternalLink = async () => {
        if (!externalUrl || !externalTitle || !onAddExternalAudio) return

        setIsProcessing(true)
        try {
            await onAddExternalAudio(externalUrl, externalTitle, externalAuthor || "Unknown Author", externalDuration)
            setIsSuccess(true)
            setTimeout(() => {
                setIsSuccess(false)
                setIsProcessing(false)
                onClose()
            }, 1500)
        } catch (err) {
            setError("Failed to add external audiobook.")
            setIsProcessing(false)
        }
    }

    const getAcceptedFiles = () => {
        switch (activeTab) {
            case "pdf": return ".pdf"
            case "audio": return ".mp3,.m4a,.m4b,.wav,.ogg,.aax"
            default: return "*"
        }
    }

    const tabs = [
        { id: "pdf" as const, label: "PDF", icon: FileText },
        { id: "audio" as const, label: "Audio", icon: Headphones },
        { id: "link" as const, label: "Link", icon: Link2 },
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
                        onClick={!isProcessing ? onClose : undefined}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b px-6 py-4 dark:border-zinc-800">
                                <h2 className="font-serif text-xl font-medium">Add to Library</h2>
                                {!isProcessing && (
                                    <button
                                        onClick={onClose}
                                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
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
                                            setAudioFile(null)
                                        }}
                                        disabled={isProcessing}
                                        className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                            ? "border-b-2 border-amber-500 text-amber-600 dark:text-amber-400"
                                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
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
                                    {/* PDF Tab */}
                                    {activeTab === "pdf" && (
                                        <motion.div
                                            key="pdf"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                        >
                                            <DropZone
                                                isDragging={isDragging}
                                                isProcessing={isProcessing}
                                                isSuccess={isSuccess}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                onClick={() => fileInputRef.current?.click()}
                                                icon={FileText}
                                                title="Upload PDF"
                                                subtitle="Drag & drop or click to browse"
                                                hint="PDF files only (max 50MB)"
                                            />
                                        </motion.div>
                                    )}

                                    {/* Audio Tab */}
                                    {activeTab === "audio" && (
                                        <motion.div
                                            key="audio"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                        >
                                            {/* AAX Info Banner */}
                                            {isAaxUpload && !audioMetadata && (
                                                <div className="mb-4 flex items-start gap-3 rounded-lg bg-amber-50 p-3 text-sm dark:bg-amber-900/20">
                                                    <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="font-medium text-amber-800 dark:text-amber-200">AAX file detected</p>
                                                        <p className="text-amber-700 dark:text-amber-300">
                                                            Automatic optimization for web playback will start after upload.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            {!audioMetadata ? (
                                                <DropZone
                                                    isDragging={isDragging}
                                                    isProcessing={isProcessing}
                                                    isSuccess={isSuccess}
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    icon={Music}
                                                    title="Upload Audiobook"
                                                    subtitle="Drag & drop MP3, M4B, AAX, or WAV"
                                                    hint="Auto-extracts cover & metadata"
                                                />
                                            ) : (
                                                <AudioPreview
                                                    metadata={audioMetadata}
                                                    isProcessing={isProcessing}
                                                    isSuccess={isSuccess}
                                                    onConfirm={handleConfirmAudioUpload}
                                                    onCancel={() => {
                                                        setAudioMetadata(null)
                                                        setAudioFile(null)
                                                    }}
                                                />
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
                                                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Audio URL
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="url"
                                                        value={externalUrl}
                                                        onChange={(e) => setExternalUrl(e.target.value)}
                                                        placeholder="https://example.com/audiobook.mp3"
                                                        className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleValidateUrl}
                                                        disabled={isValidatingUrl || !externalUrl}
                                                    >
                                                        {isValidatingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Title *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={externalTitle}
                                                        onChange={(e) => setExternalTitle(e.target.value)}
                                                        placeholder="Audiobook title"
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Author
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={externalAuthor}
                                                        onChange={(e) => setExternalAuthor(e.target.value)}
                                                        placeholder="Author name"
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                                                    />
                                                </div>
                                            </div>

                                            {externalDuration > 0 && (
                                                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                                    <Check size={16} />
                                                    <span>Duration: {formatDuration(externalDuration)}</span>
                                                </div>
                                            )}

                                            <Button
                                                className="w-full"
                                                onClick={handleConfirmExternalLink}
                                                disabled={isProcessing || !externalUrl || !externalTitle}
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Adding...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ExternalLink className="mr-2 h-4 w-4" />
                                                        Add External Audiobook
                                                    </>
                                                )}
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Error Message */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                    >
                                        <AlertCircle size={16} />
                                        <span>{error}</span>
                                    </motion.div>
                                )}

                                {/* Hidden File Input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={getAcceptedFiles()}
                                    multiple={activeTab === "pdf"}
                                    onChange={handleFileInput}
                                    className="hidden"
                                    disabled={isProcessing}
                                />

                                {/* Footer */}
                                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                                    <FileText size={14} />
                                    <span>Securely stored in your private library</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface DropZoneProps {
    isDragging: boolean
    isProcessing: boolean
    isSuccess: boolean
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
    onClick: () => void
    icon: React.ComponentType<{ className?: string }>
    title: string
    subtitle: string
    hint: string
}

function DropZone({
    isDragging,
    isProcessing,
    isSuccess,
    onDragOver,
    onDragLeave,
    onDrop,
    onClick,
    icon: Icon,
    title,
    subtitle,
    hint,
}: DropZoneProps) {
    return (
        <div
            onDragOver={!isProcessing ? onDragOver : undefined}
            onDragLeave={!isProcessing ? onDragLeave : undefined}
            onDrop={!isProcessing ? onDrop : undefined}
            onClick={!isProcessing ? onClick : undefined}
            className={`group relative flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300 ${isDragging
                ? "border-amber-500 bg-amber-50 dark:bg-amber-900/10"
                : "border-slate-200 hover:border-amber-500/50 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                } ${isProcessing || isSuccess ? "pointer-events-none" : ""}`}
        >
            <AnimatePresence mode="wait">
                {isProcessing ? (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center gap-4"
                    >
                        {isSuccess ? (
                            <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/20">
                                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                        ) : (
                            <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                        )}
                        <div className="text-center">
                            <p className="font-medium text-slate-900 dark:text-white">
                                {isSuccess ? "Upload Complete!" : "Processing..."}
                            </p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {isSuccess ? "Adding to library" : "This may take a moment"}
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <div
                            className={`rounded-full p-4 transition-colors ${isDragging
                                ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20"
                                : "bg-slate-100 text-slate-400 dark:bg-zinc-800"
                                }`}
                        >
                            <Icon className="h-8 w-8" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-slate-900 dark:text-white">{title}</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
                            <p className="mt-2 text-xs text-slate-400">{hint}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

interface AudioPreviewProps {
    metadata: AudioMetadata
    isProcessing: boolean
    isSuccess: boolean
    onConfirm: () => void
    onCancel: () => void
}

function AudioPreview({
    metadata,
    isProcessing,
    isSuccess,
    onConfirm,
    onCancel,
}: AudioPreviewProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-start gap-4 rounded-xl border bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                {/* Cover Preview */}
                <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
                    {metadata.coverUrl ? (
                        <img
                            src={metadata.coverUrl}
                            alt="Cover"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <Headphones className="h-8 w-8 text-white" />
                        </div>
                    )}
                </div>

                {/* Metadata */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-lg font-medium text-slate-900 dark:text-white truncate">
                        {metadata.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {metadata.author}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Music size={12} />
                            {metadata.format}
                        </span>
                        <span>•</span>
                        <span>{formatDuration(metadata.duration)}</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onCancel}
                    disabled={isProcessing}
                >
                    Cancel
                </Button>
                <Button
                    className="flex-1"
                    onClick={onConfirm}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isSuccess ? "Added!" : "Uploading..."}
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            Add Audiobook
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
