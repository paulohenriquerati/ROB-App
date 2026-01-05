"use client"

import { motion } from "framer-motion"
import { SlidersHorizontal, ArrowUpDown } from "lucide-react"
import type { LibraryFilter } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { CategoryFilter } from "./category-filter"

interface SearchFilterProps {
  filter: LibraryFilter
  onFilterChange: (filter: LibraryFilter) => void
  totalBooks: number
}

export function SearchFilter({ filter, onFilterChange, totalBooks }: SearchFilterProps) {
  const sortOptions = [
    { value: "last_read", label: "Last Read" },
    { value: "title", label: "Title" },
    { value: "rating", label: "Rating" },
    { value: "created_at", label: "Date Added" },
  ] as const

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-2"
    >
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Title Section */}
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">Your Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalBooks} {totalBooks === 1 ? "book" : "books"} in your collection
          </p>
        </div>

        {/* Sort/Filter Controls */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-transparent border-border/50">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onFilterChange({ ...filter, sortBy: option.value as any })}
                  className={filter.sortBy === option.value ? "bg-accent" : ""}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl bg-transparent border-border/50"
            onClick={() => onFilterChange({ ...filter, sortOrder: filter.sortOrder === "asc" ? "desc" : "asc" })}
          >
            <ArrowUpDown className={`h-4 w-4 transition-transform ${filter.sortOrder === "asc" ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <CategoryFilter
        selectedCategory={filter.category}
        onCategoryChange={(category) => onFilterChange({ ...filter, category })}
      />
    </motion.div>
  )
}

