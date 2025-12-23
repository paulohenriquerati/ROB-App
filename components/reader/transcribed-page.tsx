"use client"

import { useMemo, useState, useCallback, useRef, useEffect } from "react"
import type { PageContent, ContentBlock, ReaderSettings, Highlight } from "@/lib/types"
import { HighlightToolbar, getHighlightColorClass, type HighlightColor } from "./highlight-toolbar"

interface TranscribedPageProps {
    pageContent: PageContent
    settings: ReaderSettings
    className?: string
    highlights?: Highlight[]
    onCreateHighlight?: (text: string, color: HighlightColor) => void
    onUpdateHighlight?: (id: string, color: HighlightColor) => void
    onDeleteHighlight?: (id: string) => void
    onShareQuote?: (text: string) => void
}

/**
 * Renders transcribed PDF content with proper typography and image placement
 */
export function TranscribedPage({
    pageContent,
    settings,
    className = "",
    highlights = [],
    onCreateHighlight,
    onUpdateHighlight,
    onDeleteHighlight,
    onShareQuote,
}: TranscribedPageProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [selection, setSelection] = useState<{
        text: string
        rect: DOMRect | null
    } | null>(null)
    const [activeHighlight, setActiveHighlight] = useState<Highlight | null>(null)
    const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null)

    // Calculate styles based on reader settings
    const containerStyles = useMemo(() => {
        const fontSizeMap = {
            small: "0.875rem",
            medium: "1rem",
            large: "1.125rem",
            xlarge: "1.25rem",
        }

        const fontFamilyMap = {
            serif: "'Georgia', 'Times New Roman', serif",
            sans: "'Inter', 'Helvetica Neue', sans-serif",
            mono: "'JetBrains Mono', 'Fira Code', monospace",
        }

        const lineHeightMap = {
            tight: "1.4",
            normal: "1.6",
            relaxed: "1.8",
        }

        const marginMap = {
            narrow: "1rem",
            normal: "1.5rem",
            wide: "2.5rem",
        }

        return {
            fontSize: fontSizeMap[settings.fontSize],
            fontFamily: fontFamilyMap[settings.fontFamily],
            lineHeight: lineHeightMap[settings.lineHeight],
            padding: marginMap[settings.margins],
        }
    }, [settings])

    // Theme styles
    const themeStyles = useMemo(() => {
        switch (settings.theme) {
            case "sepia":
                return {
                    background: "#F4ECD8",
                    color: "#433422",
                    headingColor: "#2d2215",
                }
            case "dark":
                return {
                    background: "#202022",
                    color: "#E4E4E7",
                    headingColor: "#FAFAFA",
                }
            case "night":
                return {
                    background: "#0a0a0a",
                    color: "#a3a3a3",
                    headingColor: "#d4d4d4",
                }
            default:
                return {
                    background: "#FAFAF9",
                    color: "#1e293b",
                    headingColor: "#0f172a",
                }
        }
    }, [settings.theme])

    // Handle text selection
    const handleMouseUp = useCallback(() => {
        const windowSelection = window.getSelection()
        if (!windowSelection || windowSelection.isCollapsed) {
            // Check if clicked on highlight
            return
        }

        const text = windowSelection.toString().trim()
        if (text.length < 3) return

        const range = windowSelection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        setSelection({ text, rect })
        setActiveHighlight(null)
        setToolbarPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
        })
    }, [])

    // Handle clicking on existing highlights
    const handleHighlightClick = useCallback((highlight: Highlight, event: React.MouseEvent) => {
        event.stopPropagation()
        const rect = (event.target as HTMLElement).getBoundingClientRect()
        setActiveHighlight(highlight)
        setSelection(null)
        setToolbarPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
        })
    }, [])

    // Close toolbar
    const closeToolbar = useCallback(() => {
        setSelection(null)
        setActiveHighlight(null)
        setToolbarPosition(null)
        window.getSelection()?.removeAllRanges()
    }, [])

    // Handle create highlight
    const handleHighlight = useCallback((color: HighlightColor) => {
        if (selection?.text && onCreateHighlight) {
            onCreateHighlight(selection.text, color)
        }
        closeToolbar()
    }, [selection, onCreateHighlight, closeToolbar])

    // Handle color change
    const handleColorChange = useCallback((color: HighlightColor) => {
        if (activeHighlight && onUpdateHighlight) {
            onUpdateHighlight(activeHighlight.id, color)
        }
        closeToolbar()
    }, [activeHighlight, onUpdateHighlight, closeToolbar])

    // Handle delete
    const handleDelete = useCallback(() => {
        if (activeHighlight && onDeleteHighlight) {
            onDeleteHighlight(activeHighlight.id)
        }
        closeToolbar()
    }, [activeHighlight, onDeleteHighlight, closeToolbar])

    // Handle share
    const handleShare = useCallback(() => {
        const text = selection?.text || activeHighlight?.text
        if (text && onShareQuote) {
            onShareQuote(text)
        }
        closeToolbar()
    }, [selection, activeHighlight, onShareQuote, closeToolbar])

    // Close toolbar on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                closeToolbar()
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [closeToolbar])

    // Apply highlights to text content
    const applyHighlights = useCallback((text: string): React.ReactNode => {
        if (!text || highlights.length === 0) return text

        // Find all matching highlights for this text
        const matches: { start: number; end: number; highlight: Highlight }[] = []

        for (const hl of highlights) {
            let startIndex = 0
            while (startIndex < text.length) {
                const index = text.indexOf(hl.text, startIndex)
                if (index === -1) break
                matches.push({
                    start: index,
                    end: index + hl.text.length,
                    highlight: hl,
                })
                startIndex = index + 1
            }
        }

        if (matches.length === 0) return text

        // Sort by start position
        matches.sort((a, b) => a.start - b.start)

        // Build result with highlighted spans
        const result: React.ReactNode[] = []
        let lastIndex = 0

        for (const match of matches) {
            // Add text before highlight
            if (match.start > lastIndex) {
                result.push(text.slice(lastIndex, match.start))
            }

            // Add highlighted text
            result.push(
                <mark
                    key={`${match.highlight.id}-${match.start}`}
                    className={`cursor-pointer rounded-sm px-0.5 -mx-0.5 transition-all hover:opacity-80 ${getHighlightColorClass(match.highlight.color, settings.theme)}`}
                    onClick={(e) => handleHighlightClick(match.highlight, e)}
                >
                    {match.highlight.text}
                </mark>
            )

            lastIndex = match.end
        }

        // Add remaining text
        if (lastIndex < text.length) {
            result.push(text.slice(lastIndex))
        }

        return result
    }, [highlights, settings.theme, handleHighlightClick])

    // Render a single content block
    const renderBlock = (block: ContentBlock, index: number) => {
        switch (block.type) {
            case "heading":
                return (
                    <h2
                        key={index}
                        className="mb-4 mt-6 font-serif font-bold"
                        style={{
                            fontSize: `calc(${containerStyles.fontSize} * 1.5)`,
                            color: themeStyles.headingColor,
                            lineHeight: "1.3",
                        }}
                    >
                        {applyHighlights(block.content || "")}
                    </h2>
                )

            case "paragraph":
            case "text":
                return (
                    <p
                        key={index}
                        className="mb-4 text-justify"
                        style={{
                            fontSize: containerStyles.fontSize,
                            lineHeight: containerStyles.lineHeight,
                            color: themeStyles.color,
                            textIndent: index > 0 ? "1.5em" : undefined,
                        }}
                    >
                        {applyHighlights(block.content || "")}
                    </p>
                )

            case "image":
                return (
                    <figure key={index} className="my-6 flex flex-col items-center">
                        <img
                            src={block.src}
                            alt={block.alt || "Book image"}
                            className="max-w-full rounded-lg shadow-md"
                            style={{
                                maxHeight: "400px",
                                objectFit: "contain",
                            }}
                            loading="lazy"
                        />
                        {block.alt && (
                            <figcaption
                                className="mt-2 text-center text-sm opacity-70"
                                style={{ color: themeStyles.color }}
                            >
                                {block.alt}
                            </figcaption>
                        )}
                    </figure>
                )

            default:
                return null
        }
    }

    // Check if page has no content
    const hasContent = pageContent.blocks.length > 0 || pageContent.textContent.trim()

    return (
        <div
            ref={containerRef}
            className={`h-full overflow-y-auto ${className}`}
            style={{
                ...containerStyles,
                backgroundColor: themeStyles.background,
                color: themeStyles.color,
            }}
            onMouseUp={handleMouseUp}
        >
            {/* Page number indicator */}
            <div
                className="mb-4 text-center text-xs font-medium uppercase tracking-widest opacity-40"
                style={{ color: themeStyles.color }}
            >
                Page {pageContent.pageNumber}
            </div>

            {/* Render content blocks */}
            {hasContent ? (
                <div className="prose-container select-text">
                    {pageContent.blocks.map((block, index) => renderBlock(block, index))}
                </div>
            ) : (
                <div className="flex h-full items-center justify-center text-center opacity-50">
                    <p>No content extracted from this page</p>
                </div>
            )}

            {/* Highlight toolbar */}
            {toolbarPosition && (selection || activeHighlight) && (
                <HighlightToolbar
                    position={toolbarPosition}
                    selectedText={selection?.text || activeHighlight?.text || ""}
                    existingHighlightId={activeHighlight?.id}
                    existingColor={activeHighlight?.color}
                    onHighlight={handleHighlight}
                    onColorChange={handleColorChange}
                    onDelete={activeHighlight ? handleDelete : undefined}
                    onShare={onShareQuote ? handleShare : undefined}
                    onClose={closeToolbar}
                />
            )}
        </div>
    )
}

interface TranscribedSpreadProps {
    leftPage?: PageContent
    rightPage?: PageContent
    settings: ReaderSettings
    isMobile?: boolean
    highlights?: Highlight[]
    onCreateHighlight?: (page: number, text: string, color: HighlightColor) => void
    onUpdateHighlight?: (id: string, color: HighlightColor) => void
    onDeleteHighlight?: (id: string) => void
    onShareQuote?: (text: string, page: number) => void
}

/**
 * Renders a two-page spread of transcribed content (for desktop) or single page (mobile)
 */
export function TranscribedSpread({
    leftPage,
    rightPage,
    settings,
    isMobile = false,
    highlights = [],
    onCreateHighlight,
    onUpdateHighlight,
    onDeleteHighlight,
    onShareQuote,
}: TranscribedSpreadProps) {
    // Get highlights for a specific page
    const getPageHighlights = (page: number) => highlights.filter((h) => h.page === page)

    // Theme background for the spread container
    const getSpreadBackground = () => {
        switch (settings.theme) {
            case "sepia":
                return "bg-[#E8DCC0]"
            case "dark":
                return "bg-[#18181B]"
            case "night":
                return "bg-black"
            default:
                return "bg-stone-100"
        }
    }

    if (isMobile) {
        // Mobile: single page view
        const currentPage = rightPage || leftPage
        if (!currentPage) return null

        return (
            <div
                className={`relative h-full w-full overflow-hidden rounded-sm shadow-2xl ${getSpreadBackground()}`}
                style={{ filter: `brightness(${settings.brightness}%)` }}
            >
                <TranscribedPage
                    pageContent={currentPage}
                    settings={settings}
                    className="h-full"
                    highlights={getPageHighlights(currentPage.pageNumber)}
                    onCreateHighlight={(text, color) =>
                        onCreateHighlight?.(currentPage.pageNumber, text, color)
                    }
                    onUpdateHighlight={onUpdateHighlight}
                    onDeleteHighlight={onDeleteHighlight}
                    onShareQuote={(text) => onShareQuote?.(text, currentPage.pageNumber)}
                />
            </div>
        )
    }

    // Desktop: two-page spread
    return (
        <div
            className={`relative flex h-full w-full max-w-5xl overflow-hidden rounded-sm shadow-2xl ${getSpreadBackground()}`}
            style={{ filter: `brightness(${settings.brightness}%)`, aspectRatio: "3/2" }}
        >
            {/* Spine shadow */}
            <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-30 w-12 -translate-x-1/2 bg-gradient-to-r from-black/5 via-black/20 to-black/5 blur-sm mix-blend-multiply" />

            {/* Left page */}
            <div className="relative flex-1 overflow-hidden border-r border-inherit">
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-black/5 to-transparent" />
                {leftPage ? (
                    <TranscribedPage
                        pageContent={leftPage}
                        settings={settings}
                        className="h-full"
                        highlights={getPageHighlights(leftPage.pageNumber)}
                        onCreateHighlight={(text, color) =>
                            onCreateHighlight?.(leftPage.pageNumber, text, color)
                        }
                        onUpdateHighlight={onUpdateHighlight}
                        onDeleteHighlight={onDeleteHighlight}
                        onShareQuote={(text) => onShareQuote?.(text, leftPage.pageNumber)}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <span className="text-xs opacity-30">Inside Cover</span>
                    </div>
                )}
            </div>

            {/* Right page */}
            <div className="relative flex-1 overflow-hidden border-l border-inherit">
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-l from-black/5 to-transparent" />
                {rightPage ? (
                    <TranscribedPage
                        pageContent={rightPage}
                        settings={settings}
                        className="h-full"
                        highlights={getPageHighlights(rightPage.pageNumber)}
                        onCreateHighlight={(text, color) =>
                            onCreateHighlight?.(rightPage.pageNumber, text, color)
                        }
                        onUpdateHighlight={onUpdateHighlight}
                        onDeleteHighlight={onDeleteHighlight}
                        onShareQuote={(text) => onShareQuote?.(text, rightPage.pageNumber)}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <span className="text-xs opacity-30">End of book</span>
                    </div>
                )}
            </div>
        </div>
    )
}
