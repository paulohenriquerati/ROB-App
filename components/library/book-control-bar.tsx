"use client"

import { motion } from "framer-motion"
import { BookOpen, Headphones, Share2, Sparkles, MoreVertical, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BookControlBarProps {
    isVisible: boolean
    onOpen: () => void
    onPlay?: () => void
    onEdit: () => void
    onDelete: () => void
    hasAudio: boolean
}

export function BookControlBar({
    isVisible,
    onOpen,
    onPlay,
    onEdit,
    onDelete,
    hasAudio,
}: BookControlBarProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{
                opacity: isVisible ? 1 : 0,
                y: isVisible ? 0 : 20,
                scale: isVisible ? 1 : 0.9,
                pointerEvents: isVisible ? 'auto' : 'none'
            }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.8
            }}
            className={cn(
                "absolute -bottom-6 left-0 right-0 z-50 flex items-center justify-center gap-2",
                "mx-auto w-[90%]"
            )}
        >
            <div className="flex items-center gap-1 rounded-full border border-white/20 bg-black/40 p-1.5 shadow-xl backdrop-blur-xl">
                {/* Read Button - 3D Book Icon */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-white hover:bg-white/20 hover:text-white overflow-visible"
                    onClick={(e) => {
                        e.stopPropagation()
                        onOpen()
                    }}
                    title="Read Book"
                >
                    <img
                        src="/books2.png"
                        alt="Read"
                        className="h-9 w-9 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                    />
                </Button>

                {/* Audio Button */}
                {hasAudio && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full text-white hover:bg-white/20 hover:text-white"
                        onClick={(e) => {
                            e.stopPropagation()
                            onPlay?.()
                        }}
                        title="Play Audiobook"
                    >
                        <Headphones className="h-4 w-4" />
                    </Button>
                )}

                <div className="mx-1 h-4 w-px bg-white/20" />

                {/* Edit Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-white/80 hover:bg-white/20 hover:text-white"
                    onClick={(e) => {
                        e.stopPropagation()
                        onEdit()
                    }}
                    title="Edit Details"
                >
                    <Edit className="h-3.5 w-3.5" />
                </Button>

                {/* Delete Button - 3D Trash Can */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="group/delete h-10 w-10 rounded-full hover:bg-red-500/20 overflow-visible"
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                    }}
                    title="Remove Book"
                >
                    <motion.img
                        src="/books3.png"
                        alt="Remove"
                        className="h-9 w-9 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                        whileHover={{
                            rotate: [0, -10, 10, -10, 10, 0],
                            transition: { duration: 0.5, ease: "easeInOut" }
                        }}
                    />
                </Button>
            </div>
        </motion.div>
    )
}
