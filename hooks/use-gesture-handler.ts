"use client"

import { useRef, useState, useCallback, useMemo } from "react"

export interface GestureState {
    scale: number
    translateX: number
    translateY: number
    isPinching: boolean
    isZoomed: boolean
}

interface GestureHandlerOptions {
    onSwipeLeft?: () => void
    onSwipeRight?: () => void
    minSwipeDistance?: number
    swipeVelocityThreshold?: number
    minScale?: number
    maxScale?: number
}

interface TouchPoint {
    x: number
    y: number
}

function getDistance(touch1: TouchPoint, touch2: TouchPoint): number {
    const dx = touch1.x - touch2.x
    const dy = touch1.y - touch2.y
    return Math.sqrt(dx * dx + dy * dy)
}

function getMidpoint(touch1: TouchPoint, touch2: TouchPoint): TouchPoint {
    return {
        x: (touch1.x + touch2.x) / 2,
        y: (touch1.y + touch2.y) / 2,
    }
}

export function useGestureHandler(options: GestureHandlerOptions = {}) {
    const {
        onSwipeLeft,
        onSwipeRight,
        minSwipeDistance = 50,
        swipeVelocityThreshold = 0.3, // pixels per ms
        minScale = 1,
        maxScale = 3,
    } = options

    // Gesture state
    const [gestureState, setGestureState] = useState<GestureState>({
        scale: 1,
        translateX: 0,
        translateY: 0,
        isPinching: false,
        isZoomed: false,
    })

    // Touch tracking refs
    const touchStartX = useRef<number>(0)
    const touchStartY = useRef<number>(0)
    const touchStartTime = useRef<number>(0)
    const lastTouchX = useRef<number>(0)
    const lastTouchY = useRef<number>(0)
    const isPinching = useRef<boolean>(false)
    const initialPinchDistance = useRef<number>(0)
    const initialScale = useRef<number>(1)
    const touchCount = useRef<number>(0)
    const lastTapTime = useRef<number>(0)
    const gestureStarted = useRef<boolean>(false)

    // Pan tracking (for when zoomed)
    const panStartX = useRef<number>(0)
    const panStartY = useRef<number>(0)
    const initialTranslateX = useRef<number>(0)
    const initialTranslateY = useRef<number>(0)

    const resetZoom = useCallback(() => {
        setGestureState({
            scale: 1,
            translateX: 0,
            translateY: 0,
            isPinching: false,
            isZoomed: false,
        })
    }, [])

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touches = e.touches
        touchCount.current = touches.length
        touchStartTime.current = Date.now()
        gestureStarted.current = true

        if (touches.length === 1) {
            const touch = touches[0]
            touchStartX.current = touch.clientX
            touchStartY.current = touch.clientY
            lastTouchX.current = touch.clientX
            lastTouchY.current = touch.clientY

            // For panning when zoomed
            panStartX.current = touch.clientX
            panStartY.current = touch.clientY
            setGestureState(prev => {
                initialTranslateX.current = prev.translateX
                initialTranslateY.current = prev.translateY
                return prev
            })

            // Check for double-tap
            const now = Date.now()
            if (now - lastTapTime.current < 300) {
                // Double-tap detected - toggle zoom
                setGestureState(prev => {
                    if (prev.scale > 1) {
                        // Zoom out to 1x
                        return {
                            scale: 1,
                            translateX: 0,
                            translateY: 0,
                            isPinching: false,
                            isZoomed: false,
                        }
                    } else {
                        // Zoom in to 2x centered on tap position
                        return {
                            scale: 2,
                            translateX: 0,
                            translateY: 0,
                            isPinching: false,
                            isZoomed: true,
                        }
                    }
                })
                lastTapTime.current = 0 // Reset to prevent triple-tap issues
                e.preventDefault()
                return
            }
        } else if (touches.length === 2) {
            // Start pinch gesture
            isPinching.current = true
            const touch1 = { x: touches[0].clientX, y: touches[0].clientY }
            const touch2 = { x: touches[1].clientX, y: touches[1].clientY }
            initialPinchDistance.current = getDistance(touch1, touch2)
            setGestureState(prev => {
                initialScale.current = prev.scale
                return { ...prev, isPinching: true }
            })
        }
    }, [])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const touches = e.touches

        if (touches.length === 2 && isPinching.current) {
            // Pinch zoom
            const touch1 = { x: touches[0].clientX, y: touches[0].clientY }
            const touch2 = { x: touches[1].clientX, y: touches[1].clientY }
            const currentDistance = getDistance(touch1, touch2)
            const scaleFactor = currentDistance / initialPinchDistance.current
            const newScale = Math.min(maxScale, Math.max(minScale, initialScale.current * scaleFactor))

            setGestureState(prev => ({
                ...prev,
                scale: newScale,
                isPinching: true,
                isZoomed: newScale > 1,
            }))

            // Prevent default to avoid browser zoom
            e.preventDefault()
        } else if (touches.length === 1 && !isPinching.current) {
            const touch = touches[0]
            lastTouchX.current = touch.clientX
            lastTouchY.current = touch.clientY

            // If zoomed, allow panning
            setGestureState(prev => {
                if (prev.scale > 1) {
                    const deltaX = touch.clientX - panStartX.current
                    const deltaY = touch.clientY - panStartY.current

                    // Calculate bounds to prevent panning too far
                    const maxTranslateX = (prev.scale - 1) * 150 // Adjust based on container width
                    const maxTranslateY = (prev.scale - 1) * 200 // Adjust based on container height

                    const newTranslateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, initialTranslateX.current + deltaX))
                    const newTranslateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, initialTranslateY.current + deltaY))

                    return {
                        ...prev,
                        translateX: newTranslateX,
                        translateY: newTranslateY,
                    }
                }
                return prev
            })
        }
    }, [maxScale, minScale])

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const now = Date.now()

        // If we were pinching, just end the pinch
        if (isPinching.current || touchCount.current > 1) {
            isPinching.current = false
            setGestureState(prev => ({ ...prev, isPinching: false }))
            touchCount.current = e.touches.length
            gestureStarted.current = false
            return
        }

        // Record tap time for double-tap detection (only if it was a quick tap without much movement)
        const touchDuration = now - touchStartTime.current
        const swipeDistanceX = Math.abs(lastTouchX.current - touchStartX.current)
        const swipeDistanceY = Math.abs(lastTouchY.current - touchStartY.current)

        if (touchDuration < 200 && swipeDistanceX < 20 && swipeDistanceY < 20) {
            lastTapTime.current = now
        }

        // Check if we should trigger a swipe (only when not zoomed)
        setGestureState(prev => {
            if (prev.scale > 1) {
                // Don't trigger swipe when zoomed - user is panning
                return prev
            }

            const swipeDistance = touchStartX.current - lastTouchX.current
            const velocity = Math.abs(swipeDistance) / touchDuration

            // Only trigger swipe if:
            // 1. Distance is greater than minimum
            // 2. Velocity is fast enough (quick, deliberate swipe)
            // 3. Horizontal distance is greater than vertical (not a scroll attempt)
            if (
                Math.abs(swipeDistance) > minSwipeDistance &&
                velocity > swipeVelocityThreshold &&
                swipeDistanceX > swipeDistanceY
            ) {
                if (swipeDistance > 0) {
                    // Swiped left → next page
                    onSwipeLeft?.()
                } else {
                    // Swiped right → previous page
                    onSwipeRight?.()
                }
            }

            return prev
        })

        // Reset tracking
        touchCount.current = e.touches.length
        gestureStarted.current = false
    }, [minSwipeDistance, swipeVelocityThreshold, onSwipeLeft, onSwipeRight])

    const handlers = useMemo(() => ({
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
    }), [handleTouchStart, handleTouchMove, handleTouchEnd])

    return {
        gestureState,
        handlers,
        resetZoom,
    }
}
