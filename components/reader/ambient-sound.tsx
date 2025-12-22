"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { CloudRain, Flame, Trees, Waves, Volume2, VolumeX } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface AmbientSoundPanelProps {
  isOpen: boolean
  onClose: () => void
}

type SoundType = "rain" | "fireplace" | "forest" | "ocean" | null

// Using reliable public domain audio sources
const SOUNDS = [
  {
    id: "rain",
    name: "Rain",
    icon: CloudRain,
    url: "https://www.soundjay.com/nature/sounds/rain-01.mp3",
  },
  {
    id: "fireplace",
    name: "Fireplace",
    icon: Flame,
    url: "https://www.soundjay.com/nature/sounds/campfire-1.mp3",
  },
  {
    id: "forest",
    name: "Forest",
    icon: Trees,
    url: "https://www.soundjay.com/nature/sounds/birds-1.mp3",
  },
  {
    id: "ocean",
    name: "Ocean",
    icon: Waves,
    url: "https://www.soundjay.com/nature/sounds/ocean-wave-2.mp3",
  },
] as const

export function AmbientSoundPanel({ isOpen, onClose }: AmbientSoundPanelProps) {
  const [activeSound, setActiveSound] = useState<SoundType>(null)
  const [volume, setVolume] = useState(0.5)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playSound = useCallback(async (soundId: SoundType) => {
    if (!soundId) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setActiveSound(null)
      return
    }

    const sound = SOUNDS.find((s) => s.id === soundId)
    if (!sound || !audioRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      audioRef.current.src = sound.url
      audioRef.current.volume = volume
      audioRef.current.loop = true

      await audioRef.current.play()
      setActiveSound(soundId)
    } catch (e) {
      console.error("Audio play failed:", e)
      setError("Click to play audio")
      // Still set active so user can see it's selected
      setActiveSound(soundId)
    } finally {
      setIsLoading(false)
    }
  }, [volume])

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
    }
  }, [])

  return (
    <>
      {/* Audio Element - Always mounted */}
      <audio ref={audioRef} loop />

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-transparent"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-16 right-6 z-50 w-72 rounded-2xl border bg-white p-4 shadow-2xl dark:bg-zinc-900 dark:border-zinc-800"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-sans text-sm font-semibold text-slate-900 dark:text-white">
                  Ambient Sounds
                </h3>
                {activeSound && (
                  <button
                    onClick={() => playSound(null)}
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    title="Stop sound"
                  >
                    <VolumeX size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {SOUNDS.map((sound) => {
                  const Icon = sound.icon
                  const isActive = activeSound === sound.id

                  return (
                    <button
                      key={sound.id}
                      onClick={() => playSound(isActive ? null : (sound.id as SoundType))}
                      disabled={isLoading}
                      className={`flex flex-col items-center justify-center rounded-xl border p-4 transition-all duration-200 ${isActive
                        ? "border-[#e6dcc8] bg-[#fdf8eb] text-[#5d4e37] ring-1 ring-[#e6dcc8] dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-200"
                        : "border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        }`}
                    >
                      <Icon size={24} className="mb-2" />
                      <span className="text-xs font-medium">{sound.name}</span>
                    </button>
                  )
                })}
              </div>

              {/* Volume Control */}
              {activeSound && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-1">
                    <Volume2 size={16} className="text-slate-400" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900 dark:bg-zinc-800 dark:accent-white"
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
