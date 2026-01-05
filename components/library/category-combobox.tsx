"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Command as CommandPrimitive } from "cmdk"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BookCategory } from "@/lib/types"

// Predefined categories matching the filter bar
const PREDEFINED_CATEGORIES: { value: BookCategory; label: string }[] = [
    { value: "technical", label: "Technical & Dev" },
    { value: "philosophy", label: "Philosophy" },
    { value: "history", label: "History" },
    { value: "sci-fi", label: "Sci-Fi" },
    { value: "biography", label: "Biography" },
]

interface CategoryComboboxProps {
    value: string[] // Array of category slugs
    onChange: (categories: string[]) => void
    placeholder?: string
    className?: string
}

const SPRING = { stiffness: 500, damping: 30, mass: 0.8 }

export function CategoryCombobox({
    value,
    onChange,
    placeholder = "Add categories...",
    className,
}: CategoryComboboxProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Get label for a category slug
    const getCategoryLabel = (slug: string): string => {
        const predefined = PREDEFINED_CATEGORIES.find((c) => c.value === slug)
        return predefined?.label ?? slug.charAt(0).toUpperCase() + slug.slice(1).replace("-", " ")
    }

    // Filter available categories based on input
    const filteredCategories = PREDEFINED_CATEGORIES.filter((category) => {
        const matchesSearch = category.label.toLowerCase().includes(inputValue.toLowerCase())
        const notSelected = !value.includes(category.value)
        return matchesSearch && notSelected
    })

    // Check if input matches existing category exactly
    const inputMatchesExisting = PREDEFINED_CATEGORIES.some(
        (c) => c.label.toLowerCase() === inputValue.toLowerCase()
    )

    // Check if we should show "create new" option
    const showCreateOption = inputValue.trim().length > 0 && !inputMatchesExisting &&
        !value.some((v) => getCategoryLabel(v).toLowerCase() === inputValue.toLowerCase())

    // Handle selecting a category
    const handleSelect = useCallback(
        (categorySlug: string) => {
            if (!value.includes(categorySlug)) {
                onChange([...value, categorySlug])
            }
            setInputValue("")
            inputRef.current?.focus()
        },
        [value, onChange]
    )

    // Handle creating a new category
    const handleCreate = useCallback(() => {
        const newSlug = inputValue.trim().toLowerCase().replace(/\s+/g, "-")
        if (newSlug && !value.includes(newSlug)) {
            onChange([...value, newSlug])
        }
        setInputValue("")
        inputRef.current?.focus()
    }, [inputValue, value, onChange])

    // Handle removing a category
    const handleRemove = useCallback(
        (categorySlug: string) => {
            onChange(value.filter((v) => v !== categorySlug))
        },
        [value, onChange]
    )

    // Handle keyboard events
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
                // Remove last tag on backspace
                onChange(value.slice(0, -1))
            } else if (e.key === "Enter" && inputValue.trim()) {
                e.preventDefault()
                if (filteredCategories.length > 0) {
                    // Select first match
                    handleSelect(filteredCategories[0].value)
                } else if (showCreateOption) {
                    // Create new category
                    handleCreate()
                }
            } else if (e.key === "Escape") {
                setIsOpen(false)
                inputRef.current?.blur()
            }
        },
        [inputValue, value, filteredCategories, showCreateOption, onChange, handleSelect, handleCreate]
    )

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            {/* Input Container */}
            <div
                className={cn(
                    "min-h-10 flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-sm transition-all",
                    isOpen && "ring-2 ring-primary border-primary"
                )}
                onClick={() => {
                    setIsOpen(true)
                    inputRef.current?.focus()
                }}
            >
                {/* Selected Tags */}
                <AnimatePresence mode="popLayout">
                    {value.map((categorySlug) => (
                        <motion.span
                            key={categorySlug}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ type: "spring", ...SPRING }}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                        >
                            <Tag className="h-3 w-3" />
                            {getCategoryLabel(categorySlug)}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemove(categorySlug)
                                }}
                                className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </motion.span>
                    ))}
                </AnimatePresence>

                {/* Text Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? placeholder : ""}
                    className="flex-1 min-w-[80px] bg-transparent outline-none placeholder:text-muted-foreground"
                />
            </div>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (filteredCategories.length > 0 || showCreateOption) && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
                    >
                        <CommandPrimitive className="w-full" shouldFilter={false}>
                            <CommandPrimitive.List className="max-h-[200px] overflow-y-auto p-1">
                                {/* Existing Categories */}
                                {filteredCategories.map((category) => (
                                    <CommandPrimitive.Item
                                        key={category.value}
                                        value={category.value}
                                        onSelect={() => handleSelect(category.value)}
                                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent data-[selected=true]:bg-accent"
                                    >
                                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                        {category.label}
                                    </CommandPrimitive.Item>
                                ))}

                                {/* Create New Option */}
                                {showCreateOption && (
                                    <CommandPrimitive.Item
                                        value={`create-${inputValue}`}
                                        onSelect={handleCreate}
                                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-primary hover:bg-accent data-[selected=true]:bg-accent"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Create "{inputValue.trim()}"
                                    </CommandPrimitive.Item>
                                )}
                            </CommandPrimitive.List>
                        </CommandPrimitive>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
