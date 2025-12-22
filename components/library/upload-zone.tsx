"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Plus, Upload, Loader2 } from "lucide-react"
import { useCallback, useState } from "react"

interface UploadZoneProps {
  onUpload: (files: FileList) => void
  isUploading: boolean
}

export function UploadZone({ onAddBook }: { onAddBook: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <button
        onClick={onAddBook}
        className="group flex aspect-[7/10] w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white transition-all duration-300 hover:border-amber-500/50 hover:bg-amber-50/50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-800"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-3 p-4 text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-amber-100 group-hover:text-amber-600 dark:bg-zinc-800 dark:text-zinc-500 dark:group-hover:text-amber-500">
            <Plus className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 group-hover:text-amber-700 dark:text-zinc-200 dark:group-hover:text-amber-500">
              Add Book
            </p>
            <p className="mt-1 text-xs text-slate-500 selection:dark:text-zinc-500">
              Click to upload
            </p>
          </div>
        </motion.div>
      </button>
    </motion.div>
  )
}
