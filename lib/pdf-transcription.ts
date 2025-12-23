"use client"

import type {
    ContentBlock,
    PageContent,
    TranscriptionProgress,
    TranscriptionOptions,
    ContentBounds,
} from "@/lib/types"

/**
 * Dynamically imports PDF.js and sets up the worker
 */
async function getPdfJs() {
    const pdfjsLib = await import("pdfjs-dist")
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
    ).toString()
    return pdfjsLib
}

/**
 * Text item from PDF.js with position information
 */
interface TextItem {
    str: string
    dir: string
    transform: number[]
    width: number
    height: number
    fontName: string
}

/**
 * Extract text content from a PDF page with position information
 */
async function extractTextFromPage(page: any, pageNumber: number): Promise<{
    blocks: ContentBlock[]
    plainText: string
}> {
    const textContent = await page.getTextContent()
    const viewport = page.getViewport({ scale: 1 })

    const blocks: ContentBlock[] = []
    let plainText = ""
    let currentParagraph = ""
    let lastY = -1
    let order = 0

    for (const item of textContent.items as TextItem[]) {
        if (!item.str || item.str.trim() === "") continue

        // Get position from transform matrix [scaleX, skewX, skewY, scaleY, translateX, translateY]
        const [, , , , x, y] = item.transform
        const fontSize = Math.abs(item.transform[0]) // scaleX gives approximate font size

        // Convert PDF coordinates (bottom-left origin) to screen coordinates (top-left origin)
        const screenY = viewport.height - y

        // Detect paragraph breaks (significant Y change)
        if (lastY !== -1 && Math.abs(screenY - lastY) > fontSize * 1.5) {
            // End current paragraph
            if (currentParagraph.trim()) {
                const block: ContentBlock = {
                    type: fontSize > 14 ? "heading" : "paragraph",
                    content: currentParagraph.trim(),
                    bounds: { x: 0, y: screenY, width: viewport.width, height: fontSize * 1.2 },
                    style: {
                        fontSize: Math.round(fontSize),
                        fontWeight: fontSize > 14 ? "bold" : "normal",
                    },
                    order: order++,
                }
                blocks.push(block)
                plainText += currentParagraph.trim() + "\n\n"
                currentParagraph = ""
            }
        }

        currentParagraph += item.str + " "
        lastY = screenY
    }

    // Don't forget the last paragraph
    if (currentParagraph.trim()) {
        const block: ContentBlock = {
            type: "paragraph",
            content: currentParagraph.trim(),
            bounds: { x: 0, y: lastY, width: viewport.width, height: 20 },
            style: { fontSize: 12 },
            order: order++,
        }
        blocks.push(block)
        plainText += currentParagraph.trim()
    }

    return { blocks, plainText }
}

/**
 * Extract images from a PDF page by detecting image regions
 * This renders the page to canvas and detects non-text regions
 */
async function extractImagesFromPage(
    page: any,
    pageNumber: number,
    bookId: string,
    uploadImage: (imageData: string, bookId: string, pageNumber: number, index: number) => Promise<string | null>
): Promise<ContentBlock[]> {
    const blocks: ContentBlock[] = []

    try {
        // Get operator list to find image operations
        const operatorList = await page.getOperatorList()
        const viewport = page.getViewport({ scale: 1.5 })

        // Track image positions from operator list
        let imageIndex = 0

        for (let i = 0; i < operatorList.fnArray.length; i++) {
            const fn = operatorList.fnArray[i]

            // OPS.paintImageXObject = 85, OPS.paintJpegXObject = 82
            if (fn === 85 || fn === 82) {
                const args = operatorList.argsArray[i]
                if (args && args.length > 0) {
                    try {
                        // Get the image object
                        const imgName = args[0]
                        const objs = await page.objs.get(imgName)

                        if (objs && objs.data) {
                            // Create canvas to render the image
                            const canvas = document.createElement("canvas")
                            canvas.width = objs.width || 200
                            canvas.height = objs.height || 200
                            const ctx = canvas.getContext("2d")

                            if (ctx && objs.data) {
                                // Create ImageData from the raw pixel data
                                const imageData = ctx.createImageData(canvas.width, canvas.height)

                                // PDF.js returns image data in different formats
                                if (objs.data.length === canvas.width * canvas.height * 4) {
                                    // RGBA format
                                    imageData.data.set(objs.data)
                                } else if (objs.data.length === canvas.width * canvas.height * 3) {
                                    // RGB format - convert to RGBA
                                    for (let j = 0; j < objs.data.length / 3; j++) {
                                        imageData.data[j * 4] = objs.data[j * 3]
                                        imageData.data[j * 4 + 1] = objs.data[j * 3 + 1]
                                        imageData.data[j * 4 + 2] = objs.data[j * 3 + 2]
                                        imageData.data[j * 4 + 3] = 255
                                    }
                                }

                                ctx.putImageData(imageData, 0, 0)

                                // Convert to base64
                                const imageDataUrl = canvas.toDataURL("image/jpeg", 0.85)

                                // Upload and get URL
                                const imageUrl = await uploadImage(imageDataUrl, bookId, pageNumber, imageIndex)

                                if (imageUrl) {
                                    blocks.push({
                                        type: "image",
                                        src: imageUrl,
                                        alt: `Image from page ${pageNumber}`,
                                        bounds: {
                                            x: 0,
                                            y: 0,
                                            width: canvas.width,
                                            height: canvas.height,
                                        },
                                        order: 1000 + imageIndex, // Images after text
                                    })
                                    imageIndex++
                                }
                            }
                        }
                    } catch (imgError) {
                        console.warn(`Could not extract image ${imageIndex} from page ${pageNumber}:`, imgError)
                    }
                }
            }
        }
    } catch (error) {
        console.warn(`Error extracting images from page ${pageNumber}:`, error)
    }

    return blocks
}

/**
 * Render a page to canvas and extract it as a full-page image
 * Used as fallback for pages with complex layouts or when text extraction fails
 */
async function renderPageAsImage(page: any, scale: number = 1.5): Promise<string> {
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")

    if (!context) {
        throw new Error("Could not get canvas context")
    }

    canvas.height = viewport.height
    canvas.width = viewport.width

    await page.render({
        canvasContext: context,
        viewport: viewport,
    }).promise

    return canvas.toDataURL("image/jpeg", 0.9)
}

/**
 * Main transcription function - extracts text and images from a PDF
 */
export async function transcribePdf(
    pdfUrl: string,
    bookId: string,
    options: TranscriptionOptions = {},
    uploadImage: (imageData: string, bookId: string, pageNumber: number, index: number) => Promise<string | null>
): Promise<PageContent[]> {
    const {
        extractImages = true,
        preserveLayout = true,
        onProgress,
    } = options

    const pdfjsLib = await getPdfJs()
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise
    const totalPages = pdf.numPages
    const pages: PageContent[] = []

    // Report initial progress
    onProgress?.({
        bookId,
        currentPage: 0,
        totalPages,
        status: "processing",
    })

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        try {
            const page = await pdf.getPage(pageNum)

            // Extract text content
            const { blocks: textBlocks, plainText } = await extractTextFromPage(page, pageNum)

            // Extract images if enabled
            let imageBlocks: ContentBlock[] = []
            if (extractImages) {
                imageBlocks = await extractImagesFromPage(page, pageNum, bookId, uploadImage)
            }

            // Combine and sort blocks by reading order
            const allBlocks = [...textBlocks, ...imageBlocks].sort((a, b) => a.order - b.order)

            const pageContent: PageContent = {
                pageNumber: pageNum,
                blocks: allBlocks,
                textContent: plainText,
                hasImages: imageBlocks.length > 0,
                extractedAt: new Date().toISOString(),
            }

            pages.push(pageContent)

            // Report progress
            onProgress?.({
                bookId,
                currentPage: pageNum,
                totalPages,
                status: "processing",
            })
        } catch (pageError) {
            console.error(`Error transcribing page ${pageNum}:`, pageError)

            // Add empty page placeholder on error
            pages.push({
                pageNumber: pageNum,
                blocks: [],
                textContent: "",
                hasImages: false,
                extractedAt: new Date().toISOString(),
            })
        }
    }

    // Report completion
    onProgress?.({
        bookId,
        currentPage: totalPages,
        totalPages,
        status: "completed",
    })

    return pages
}

/**
 * Extract just the text content from a PDF (faster, no images)
 */
export async function extractTextOnly(pdfUrl: string): Promise<string> {
    const pdfjsLib = await getPdfJs()
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise
    const totalPages = pdf.numPages
    let fullText = ""

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()

        for (const item of textContent.items as TextItem[]) {
            if (item.str) {
                fullText += item.str + " "
            }
        }
        fullText += "\n\n--- Page " + pageNum + " ---\n\n"
    }

    return fullText
}

/**
 * Get word count estimate from transcribed pages
 */
export function getWordCount(pages: PageContent[]): number {
    return pages.reduce((count, page) => {
        return count + page.textContent.split(/\s+/).filter(Boolean).length
    }, 0)
}

/**
 * Search within transcribed content
 */
export function searchInContent(pages: PageContent[], query: string): {
    pageNumber: number
    snippet: string
    position: number
}[] {
    const results: { pageNumber: number; snippet: string; position: number }[] = []
    const lowerQuery = query.toLowerCase()

    for (const page of pages) {
        const lowerText = page.textContent.toLowerCase()
        let position = lowerText.indexOf(lowerQuery)

        while (position !== -1) {
            // Get surrounding context (50 chars before and after)
            const start = Math.max(0, position - 50)
            const end = Math.min(page.textContent.length, position + query.length + 50)
            const snippet = page.textContent.slice(start, end)

            results.push({
                pageNumber: page.pageNumber,
                snippet: (start > 0 ? "..." : "") + snippet + (end < page.textContent.length ? "..." : ""),
                position,
            })

            position = lowerText.indexOf(lowerQuery, position + 1)
        }
    }

    return results
}
