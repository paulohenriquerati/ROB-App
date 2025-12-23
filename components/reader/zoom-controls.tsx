"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ZoomIn, ZoomOut, Maximize, Move } from "lucide-react"

export interface ZoomState {
    scale: number
    translateX: number
    translateY: number
    isZoomed: boolean
}

interface ZoomControlsProps {
    zoomState: ZoomState
    onZoomIn: () => void
    onZoomOut: () => void
    onReset: () => void
    theme?: "light" | "sepia" | "dark" | "night"
}

/**
 * Zoom control buttons for the reader
 */
export function ZoomControls({
    zoomState,
    onZoomIn,
    onZoomOut,
    onReset,
    theme = "light",
}: ZoomControlsProps) {
    const isDark = theme === "dark" || theme === "night"

    const buttonClass = isDark
        ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
        : "bg-black/5 text-slate-700 border-slate-200 hover:bg-black/10"

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1 rounded-full border p-1 backdrop-blur-md"
            style={{
                background: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.8)",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            }}
        >
            {/* Zoom Out */}
            <button
                onClick={onZoomOut}
                disabled={zoomState.scale <= 1}
                className={`rounded-full p-2 transition-all disabled:opacity-30 ${buttonClass}`}
                title="Zoom out (−)"
            >
                <ZoomOut size={16} />
            </button>

            {/* Zoom indicator */}
            <span
                className={`min-w-[3rem] text-center text-xs font-medium tabular-nums ${isDark ? "text-white/80" : "text-slate-600"
                    }`}
            >
                {Math.round(zoomState.scale * 100)}%
            </span>

            {/* Zoom In */}
            <button
                onClick={onZoomIn}
                disabled={zoomState.scale >= 3}
                className={`rounded-full p-2 transition-all disabled:opacity-30 ${buttonClass}`}
                title="Zoom in (+)"
            >
                <ZoomIn size={16} />
            </button>

            {/* Reset (only show when zoomed) */}
            {zoomState.isZoomed && (
                <button
                    onClick={onReset}
                    className={`rounded-full p-2 transition-all ${buttonClass}`}
                    title="Reset zoom (Esc)"
                >
                    <Maximize size={16} />
                </button>
            )}
        </motion.div>
    )
}

interface UseZoomOptions {
    minScale?: number
    maxScale?: number
    zoomStep?: number
    containerRef?: React.RefObject<HTMLElement>
}

/**
 * Hook for managing zoom state with smooth controls
 */
export function useZoom(options: UseZoomOptions = {}) {
    const { minScale = 1, maxScale = 3, zoomStep = 0.5 } = options

    const [zoomState, setZoomState] = useState<ZoomState>({
        scale: 1,
        translateX: 0,
        translateY: 0,
        isZoomed: false,
    })

    // For mouse drag panning
    const isDragging = useRef(false)
    const dragStart = useRef({ x: 0, y: 0 })
    const translateStart = useRef({ x: 0, y: 0 })

    const setScale = useCallback((newScale: number) => {
        const clampedScale = Math.max(minScale, Math.min(maxScale, newScale))
        setZoomState((prev) => ({
            ...prev,
            scale: clampedScale,
            isZoomed: clampedScale > 1,
            // Reset translation when zooming back to 1x
            translateX: clampedScale === 1 ? 0 : prev.translateX,
            translateY: clampedScale === 1 ? 0 : prev.translateY,
        }))
    }, [minScale, maxScale])

    const zoomIn = useCallback(() => {
        setZoomState((prev) => {
            const newScale = Math.min(maxScale, prev.scale + zoomStep)
            return {
                ...prev,
                scale: newScale,
                isZoomed: newScale > 1,
            }
        })
    }, [maxScale, zoomStep])

    const zoomOut = useCallback(() => {
        setZoomState((prev) => {
            const newScale = Math.max(minScale, prev.scale - zoomStep)
            return {
                ...prev,
                scale: newScale,
                isZoomed: newScale > 1,
                // Reset translation when going back to 1x
                translateX: newScale === 1 ? 0 : prev.translateX,
                translateY: newScale === 1 ? 0 : prev.translateY,
            }
        })
    }, [minScale, zoomStep])

    const resetZoom = useCallback(() => {
        setZoomState({
            scale: 1,
            translateX: 0,
            translateY: 0,
            isZoomed: false,
        })
    }, [])

    const setTranslate = useCallback((x: number, y: number) => {
        setZoomState((prev) => {
            // Calculate max translation based on current scale
            const maxTranslate = ((prev.scale - 1) / prev.scale) * 50 // percentage
            const clampedX = Math.max(-maxTranslate, Math.min(maxTranslate, x))
            const clampedY = Math.max(-maxTranslate, Math.min(maxTranslate, y))

            return {
                ...prev,
                translateX: clampedX,
                translateY: clampedY,
            }
        })
    }, [])

    // Mouse handlers for dragging when zoomed
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (zoomState.scale <= 1) return

        isDragging.current = true
        dragStart.current = { x: e.clientX, y: e.clientY }
        translateStart.current = { x: zoomState.translateX, y: zoomState.translateY }
        e.preventDefault()
    }, [zoomState.scale, zoomState.translateX, zoomState.translateY])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging.current || zoomState.scale <= 1) return

        const deltaX = (e.clientX - dragStart.current.x) / zoomState.scale
        const deltaY = (e.clientY - dragStart.current.y) / zoomState.scale

        // Calculate percentage-based translation
        const newX = translateStart.current.x + deltaX * 0.2
        const newY = translateStart.current.y + deltaY * 0.2

        setTranslate(newX, newY)
    }, [zoomState.scale, setTranslate])

    const handleMouseUp = useCallback(() => {
        isDragging.current = false
    }, [])

    // Touch handlers for pinch zoom and pan
    const touchState = useRef({
        initialDistance: 0,
        initialScale: 1,
        lastTouchCount: 0,
        panStart: { x: 0, y: 0 },
        translateStart: { x: 0, y: 0 },
    })

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touches = e.touches

        if (touches.length === 1 && zoomState.scale > 1) {
            // Single touch while zoomed = pan
            touchState.current.panStart = {
                x: touches[0].clientX,
                y: touches[0].clientY,
            }
            touchState.current.translateStart = {
                x: zoomState.translateX,
                y: zoomState.translateY,
            }
        } else if (touches.length === 2) {
            // Two fingers = pinch
            const dx = touches[0].clientX - touches[1].clientX
            const dy = touches[0].clientY - touches[1].clientY
            touchState.current.initialDistance = Math.sqrt(dx * dx + dy * dy)
            touchState.current.initialScale = zoomState.scale
        }

        touchState.current.lastTouchCount = touches.length
    }, [zoomState.scale, zoomState.translateX, zoomState.translateY])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const touches = e.touches

        if (touches.length === 2) {
            // Pinch zoom
            const dx = touches[0].clientX - touches[1].clientX
            const dy = touches[0].clientY - touches[1].clientY
            const currentDistance = Math.sqrt(dx * dx + dy * dy)

            if (touchState.current.initialDistance > 0) {
                const scaleFactor = currentDistance / touchState.current.initialDistance
                const newScale = touchState.current.initialScale * scaleFactor
                setScale(newScale)
            }

            e.preventDefault()
        } else if (touches.length === 1 && zoomState.scale > 1) {
            // Pan while zoomed
            const deltaX = (touches[0].clientX - touchState.current.panStart.x) / zoomState.scale
            const deltaY = (touches[0].clientY - touchState.current.panStart.y) / zoomState.scale

            const newX = touchState.current.translateStart.x + deltaX * 0.2
            const newY = touchState.current.translateStart.y + deltaY * 0.2

            setTranslate(newX, newY)
            e.preventDefault()
        }
    }, [zoomState.scale, setScale, setTranslate])

    const handleTouchEnd = useCallback((e?: React.TouchEvent) => {
        touchState.current.initialDistance = 0
    }, [])

    // Double-tap to toggle zoom
    const lastTapRef = useRef(0)
    const handleDoubleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const now = Date.now()
        if (now - lastTapRef.current < 300) {
            // Double click/tap
            if (zoomState.scale > 1) {
                resetZoom()
            } else {
                setScale(2)
            }
            e.preventDefault()
        }
        lastTapRef.current = now
    }, [zoomState.scale, resetZoom, setScale])

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "+" || e.key === "=") {
                zoomIn()
                e.preventDefault()
            } else if (e.key === "-") {
                zoomOut()
                e.preventDefault()
            } else if (e.key === "Escape" && zoomState.isZoomed) {
                resetZoom()
                e.preventDefault()
            } else if (e.key === "0") {
                resetZoom()
                e.preventDefault()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [zoomIn, zoomOut, resetZoom, zoomState.isZoomed])

    // Mouse wheel zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            const delta = e.deltaY > 0 ? -0.1 : 0.1
            setScale(zoomState.scale + delta)
        }
    }, [zoomState.scale, setScale])

    const zoomHandlers = {
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
        onMouseLeave: handleMouseUp,
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        onClick: handleDoubleClick,
        onWheel: handleWheel,
    }

    const getTransformStyle = useCallback(() => ({
        transform: `scale(${zoomState.scale}) translate(${zoomState.translateX}%, ${zoomState.translateY}%)`,
        transformOrigin: "center center",
        transition: isDragging.current ? "none" : "transform 0.2s ease-out",
        cursor: zoomState.isZoomed ? (isDragging.current ? "grabbing" : "grab") : "default",
    }), [zoomState])

    return {
        zoomState,
        zoomIn,
        zoomOut,
        resetZoom,
        setScale,
        setTranslate,
        zoomHandlers,
        getTransformStyle,
    }
}
