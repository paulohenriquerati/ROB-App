"use client"

import { motion } from "framer-motion"
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react"
import type { LibraryFilter } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

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
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">Your Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalBooks} {totalBooks === 1 ? "book" : "books"} in your collection
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search books..."
            value={filter.search}
            onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring sm:w-64"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10 bg-transparent">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onFilterChange({ ...filter, sortBy: option.value as any })}
                className={filter.sortBy === option.value ? "bg-accent/10" : ""}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 bg-transparent"
          onClick={() => onFilterChange({ ...filter, sortOrder: filter.sortOrder === "asc" ? "desc" : "asc" })}
        >
          <ArrowUpDown className={`h-4 w-4 transition-transform ${filter.sortOrder === "asc" ? "rotate-180" : ""}`} />
        </Button>
      </div>
    </motion.div>
  )
}
