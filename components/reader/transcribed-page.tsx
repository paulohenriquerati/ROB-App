"use client"

import { useMemo } from "react"
import type { PageContent, ContentBlock, ReaderSettings } from "@/lib/types"

interface TranscribedPageProps {
    pageContent: PageContent
    settings: ReaderSettings
    className?: string
}

/**
 * Renders transcribed PDF content with proper typography and image placement
 */
export function TranscribedPage({ pageContent, settings, className = "" }: TranscribedPageProps) {
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
                        {block.content}
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
                        {block.content}
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
            className={`h-full overflow-y-auto ${className}`}
            style={{
                ...containerStyles,
                backgroundColor: themeStyles.background,
                color: themeStyles.color,
            }}
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
                <div className="prose-container">
                    {pageContent.blocks.map((block, index) => renderBlock(block, index))}
                </div>
            ) : (
                <div className="flex h-full items-center justify-center text-center opacity-50">
                    <p>No content extracted from this page</p>
                </div>
            )}
        </div>
    )
}

interface TranscribedSpreadProps {
    leftPage?: PageContent
    rightPage?: PageContent
    settings: ReaderSettings
    isMobile?: boolean
}

/**
 * Renders a two-page spread of transcribed content (for desktop) or single page (mobile)
 */
export function TranscribedSpread({
    leftPage,
    rightPage,
    settings,
    isMobile = false,
}: TranscribedSpreadProps) {
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
                <TranscribedPage pageContent={currentPage} settings={settings} className="h-full" />
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
                    <TranscribedPage pageContent={leftPage} settings={settings} className="h-full" />
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
                    <TranscribedPage pageContent={rightPage} settings={settings} className="h-full" />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <span className="text-xs opacity-30">End of book</span>
                    </div>
                )}
            </div>
        </div>
    )
}
