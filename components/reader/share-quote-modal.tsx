"use client"

import { motion } from "framer-motion"
import { X, Twitter, Copy, Check, Quote } from "lucide-react"
import { useState } from "react"
import type { Book } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ShareQuoteModalProps {
  book: Book
  currentPage: number
  pageContent: string
  onClose: () => void
}

export function ShareQuoteModal({ book, currentPage, pageContent, onClose }: ShareQuoteModalProps) {
  const [selectedText, setSelectedText] = useState(pageContent.slice(0, 200))
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const quoteText = `"${selectedText}"\n\n— ${book.author}, ${book.title} (p. ${currentPage})`
    await navigator.clipboard.writeText(quoteText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `"${selectedText.slice(0, 200)}${selectedText.length > 200 ? "..." : ""}"\n\n— ${book.author}, ${book.title}`,
    )
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank")
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Quote className="h-5 w-5 text-accent" />
            </div>
            <h2 className="font-serif text-xl font-medium">Share Quote</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-muted-foreground">Select quote text</label>
          <Textarea
            value={selectedText}
            onChange={(e) => setSelectedText(e.target.value)}
            rows={4}
            className="resize-none font-serif italic"
            placeholder="Enter or edit the quote you want to share..."
          />
        </div>

        <div className="mb-6 rounded-lg bg-secondary p-4">
          <p className="text-sm text-muted-foreground">
            From <span className="font-medium text-foreground">{book.title}</span> by{" "}
            <span className="font-medium text-foreground">{book.author}</span>, page {currentPage}
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleCopy} variant="outline" className="flex-1 gap-2 bg-transparent">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Quote"}
          </Button>
          <Button onClick={handleShareTwitter} className="flex-1 gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8]">
            <Twitter className="h-4 w-4" />
            Share on X
          </Button>
        </div>
      </motion.div>
    </>
  )
}
