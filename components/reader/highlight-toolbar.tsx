"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Share, X } from "lucide-react"
import { useState } from "react"

export type HighlightColor = "yellow" | "green" | "blue" | "pink"

interface HighlightToolbarProps {
    position: { x: number; y: number }
    selectedText: string
    existingHighlightId?: string
    existingColor?: HighlightColor
    onHighlight: (color: HighlightColor) => void
    onColorChange?: (color: HighlightColor) => void
    onDelete?: () => void
    onShare?: () => void
    onClose: () => void
}

const colorOptions: { color: HighlightColor; bg: string; hover: string; ring: string }[] = [
    { color: "yellow", bg: "bg-yellow-300", hover: "hover:bg-yellow-400", ring: "ring-yellow-500" },
    { color: "green", bg: "bg-green-300", hover: "hover:bg-green-400", ring: "ring-green-500" },
    { color: "blue", bg: "bg-blue-300", hover: "hover:bg-blue-400", ring: "ring-blue-500" },
    { color: "pink", bg: "bg-pink-300", hover: "hover:bg-pink-400", ring: "ring-pink-500" },
]

export function HighlightToolbar({
    position,
    selectedText,
    existingHighlightId,
    existingColor,
    onHighlight,
    onColorChange,
    onDelete,
    onShare,
    onClose,
}: HighlightToolbarProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleColorClick = (color: HighlightColor) => {
        if (existingHighlightId && onColorChange) {
            onColorChange(color)
        } else {
            onHighlight(color)
        }
    }

    const handleDelete = async () => {
        if (!onDelete) return
        setIsDeleting(true)
        onDelete()
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="fixed z-[100] shadow-xl rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    transform: "translateX(-50%)",
                }}
            >
                {/* Arrow pointer */}
                <div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-800 border-r border-b border-zinc-200 dark:border-zinc-700 rotate-45"
                    style={{ marginBottom: "-2px" }}
                />

                <div className="relative flex items-center gap-1 p-2">
                    {/* Color options */}
                    <div className="flex items-center gap-1 pr-2 border-r border-zinc-200 dark:border-zinc-700">
                        {colorOptions.map(({ color, bg, hover, ring }) => (
                            <button
                                key={color}
                                onClick={() => handleColorClick(color)}
                                className={`w-6 h-6 rounded-full ${bg} ${hover} transition-all duration-150 ${existingColor === color ? `ring-2 ${ring} ring-offset-1` : ""
                                    }`}
                                title={`Highlight ${color}`}
                            />
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 pl-1">
                        {onShare && selectedText && (
                            <button
                                onClick={onShare}
                                className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                                title="Share quote"
                            >
                                <Share className="w-4 h-4" />
                            </button>
                        )}

                        {existingHighlightId && onDelete && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors disabled:opacity-50"
                                title="Remove highlight"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 transition-colors"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}

/**
 * Get highlight background color CSS class
 */
export function getHighlightColorClass(color: HighlightColor, theme: string): string {
    const isDark = theme === "dark" || theme === "night"

    const colorMap: Record<HighlightColor, { light: string; dark: string }> = {
        yellow: { light: "bg-yellow-200/70", dark: "bg-yellow-500/30" },
        green: { light: "bg-green-200/70", dark: "bg-green-500/30" },
        blue: { light: "bg-blue-200/70", dark: "bg-blue-500/30" },
        pink: { light: "bg-pink-200/70", dark: "bg-pink-500/30" },
    }

    return isDark ? colorMap[color].dark : colorMap[color].light
}
