"use client"

import { useEffect, useRef, useState } from "react"

interface PdfPageProps {
    pdfUrl: string
    pageNumber: number
    width?: number
    height?: number
    className?: string
    onError?: () => void
}

export function PdfPage({ pdfUrl, pageNumber, width, height, className = "", onError }: PdfPageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!pdfUrl || !canvasRef.current) return

        const canvas = canvasRef.current
        const context = canvas.getContext("2d")
        if (!context) return

        let cancelled = false
        let renderTask: any = null

        const renderPage = async () => {
            try {
                setIsLoading(true)
                setError(null)

                // Dynamically import PDF.js only on client side
                const pdfjsLib = await import("pdfjs-dist")

                // Set up worker
                pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                    "pdfjs-dist/build/pdf.worker.min.mjs",
                    import.meta.url
                ).toString()

                if (cancelled) return

                const pdf = await pdfjsLib.getDocument(pdfUrl).promise

                if (cancelled) return

                if (pageNumber < 1 || pageNumber > pdf.numPages) {
                    setError("Page not found")
                    setIsLoading(false)
                    return
                }

                const page = await pdf.getPage(pageNumber)

                if (cancelled) return

                // Calculate scale to fit the container
                const containerWidth = width || canvas.parentElement?.clientWidth || 400
                const containerHeight = height || canvas.parentElement?.clientHeight || 600

                const viewport = page.getViewport({ scale: 1 })
                const scaleX = containerWidth / viewport.width
                const scaleY = containerHeight / viewport.height
                const scale = Math.min(scaleX, scaleY) * 1.5

                const scaledViewport = page.getViewport({ scale })

                canvas.height = scaledViewport.height
                canvas.width = scaledViewport.width

                context.clearRect(0, 0, canvas.width, canvas.height)

                renderTask = page.render({
                    canvasContext: context,
                    viewport: scaledViewport,
                })

                await renderTask.promise

                if (!cancelled) {
                    setIsLoading(false)
                }
            } catch (err: any) {
                if (err?.name === "RenderingCancelledException" || cancelled) {
                    return
                }
                console.error("Error rendering PDF page:", err)
                setError("Failed to load page")
                setIsLoading(false)
                onError?.()
            }
        }

        renderPage()

        return () => {
            cancelled = true
            if (renderTask) {
                try {
                    renderTask.cancel()
                } catch (e) {
                    // Ignore cancel errors
                }
            }
        }
    }, [pdfUrl, pageNumber, width, height])

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    {error}
                </div>
            )}
            <canvas
                ref={canvasRef}
                className="max-h-full max-w-full object-contain"
                style={{
                    opacity: isLoading ? 0 : 1,
                    transition: "opacity 0.3s ease"
                }}
            />
        </div>
    )
}
