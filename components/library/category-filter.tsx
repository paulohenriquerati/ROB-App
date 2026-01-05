"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { BookCategory } from "@/lib/types"
import { cn } from "@/lib/utils"

interface CategoryFilterProps {
    selectedCategory: BookCategory
    onCategoryChange: (category: BookCategory) => void
}

const CATEGORIES: { value: BookCategory; label: string }[] = [
    { value: "all", label: "All" },
    { value: "technical", label: "Technical & Dev" },
    { value: "philosophy", label: "Philosophy" },
    { value: "history", label: "History" },
    { value: "sci-fi", label: "Sci-Fi" },
    { value: "biography", label: "Biography" },
]

const SPRING = { stiffness: 500, damping: 30, mass: 0.8 }

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative py-4"
        >
            {/* Scrollable Container with Gradient Masks */}
            <div className="relative">
                {/* Left Gradient Mask */}
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-background to-transparent" />

                {/* Right Gradient Mask */}
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-background to-transparent" />

                {/* Scrollable Pill Container */}
                <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-1 py-1">
                    <AnimatePresence mode="wait">
                        {CATEGORIES.map((category) => {
                            const isActive = selectedCategory === category.value

                            return (
                                <motion.button
                                    key={category.value}
                                    onClick={() => onCategoryChange(category.value)}
                                    whileHover={{ scale: isActive ? 1.02 : 1.05 }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ type: "spring", ...SPRING }}
                                    className={cn(
                                        "relative flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
                                        "border backdrop-blur-sm",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                        isActive
                                            ? "border-transparent bg-primary text-primary-foreground shadow-md"
                                            : "border-border/50 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    )}
                                >
                                    {/* Active Indicator Background */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeCategory"
                                            className="absolute inset-0 rounded-full bg-primary"
                                            initial={false}
                                            transition={{ type: "spring", ...SPRING }}
                                            style={{ zIndex: -1 }}
                                        />
                                    )}

                                    {/* Label */}
                                    <span className="relative z-10 whitespace-nowrap">
                                        {category.label}
                                    </span>
                                </motion.button>
                            )
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    )
}
