"use client"

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
 * Extracts the first page of a PDF file and renders it as a base64 image URL
 */
export async function extractPdfCover(file: File): Promise<string> {
    try {
        const pdfjsLib = await getPdfJs()

        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const page = await pdf.getPage(1)

        const scale = 1.5
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

        return canvas.toDataURL("image/jpeg", 0.8)
    } catch (error) {
        console.error("Error extracting PDF cover:", error)
        return "/placeholder.svg?height=400&width=280&query=book cover"
    }
}

/**
 * Extracts metadata from a PDF file including author, title, and page count
 */
export async function extractPdfMetadata(file: File): Promise<{
    author: string
    title: string
    pageCount: number
}> {
    try {
        const pdfjsLib = await getPdfJs()

        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const metadata = await pdf.getMetadata()

        const info = metadata?.info as Record<string, any> | undefined

        return {
            author: info?.Author || "Unknown Author",
            title: info?.Title || file.name.replace(".pdf", ""),
            pageCount: pdf.numPages,
        }
    } catch (error) {
        console.error("Error extracting PDF metadata:", error)
        return {
            author: "Unknown Author",
            title: file.name.replace(".pdf", ""),
            pageCount: 100,
        }
    }
}

/**
 * Extracts both cover image and metadata from a PDF file
 */
export async function extractPdfInfo(file: File): Promise<{
    coverUrl: string
    author: string
    title: string
    pageCount: number
}> {
    const [coverUrl, metadata] = await Promise.all([
        extractPdfCover(file),
        extractPdfMetadata(file),
    ])

    return {
        coverUrl,
        ...metadata,
    }
}
