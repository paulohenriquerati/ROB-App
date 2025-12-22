"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, FileText, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AddBookModalProps {
    isOpen: boolean
    onClose: () => void
    onUpload: (files: FileList) => Promise<void>
}

export function AddBookModal({ isOpen, onClose, onUpload }: AddBookModalProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragging(false)
            const files = e.dataTransfer.files
            if (files.length > 0) {
                await handleFiles(files)
            }
        },
        [],
    )

    const handleFileInput = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files.length > 0) {
                await handleFiles(files)
            }
        },
        [],
    )

    const handleFiles = async (files: FileList) => {
        setIsUploading(true)
        try {
            await onUpload(files)
            setIsSuccess(true)
            setTimeout(() => {
                setIsSuccess(false)
                setIsUploading(false)
                onClose()
            }, 1500)
        } catch (error) {
            console.error("Upload failed", error)
            setIsUploading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isUploading ? onClose : undefined}
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
                                <h2 className="font-serif text-xl font-medium">Add New Book</h2>
                                {!isUploading && (
                                    <button
                                        onClick={onClose}
                                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                <div
                                    onDragOver={!isUploading ? handleDragOver : undefined}
                                    onDragLeave={!isUploading ? handleDragLeave : undefined}
                                    onDrop={!isUploading ? handleDrop : undefined}
                                    onClick={() => !isUploading && fileInputRef.current?.click()}
                                    className={`group relative flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300 ${isDragging
                                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/10"
                                        : "border-slate-200 hover:border-amber-500/50 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                                        } ${isUploading || isSuccess ? "pointer-events-none" : ""}`}
                                >
                                    <AnimatePresence mode="wait">
                                        {isUploading ? (
                                            <motion.div
                                                key="uploading"
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
                                                        {isSuccess ? "Upload Complete!" : "Uploading your book..."}
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
                                                <div className={`rounded-full p-4 transition-colors ${isDragging ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20" : "bg-slate-100 text-slate-400 dark:bg-zinc-800"}`}>
                                                    <Upload className="h-8 w-8" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        Click to upload or drag & drop
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                        PDF files only (max 50MB)
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        multiple
                                        onChange={handleFileInput}
                                        className="hidden"
                                        disabled={isUploading}
                                    />
                                </div>

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
