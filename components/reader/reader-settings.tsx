"use client"

import {
  X,
  Type,
  AlignLeft,
  Sun,
  Minus,
  Plus,
  Moon,
  Check,
  AlignJustify,
  AlignRight,
  Monitor,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { type ReaderSettings } from "@/lib/types"

interface ReaderSettingsPanelProps {
  settings: ReaderSettings
  onSettingsChange: (settings: ReaderSettings) => void
  isOpen: boolean
  onClose: () => void
}

export function ReaderSettingsPanel({
  settings,
  onSettingsChange,
  isOpen,
  onClose,
}: ReaderSettingsPanelProps) {
  const updateSettings = (updates: Partial<ReaderSettings>) => {
    onSettingsChange({ ...settings, ...updates })
  }

  const themes = [
    { id: "light", name: "Light", color: "bg-white", border: "border-slate-200" },
    { id: "sepia", name: "Sepia", color: "bg-[#F4ECD8]", border: "border-[#E8DCC0]" },
    { id: "dark", name: "Dark", color: "bg-[#18181B]", border: "border-zinc-700" },
    { id: "night", name: "Night", color: "bg-black", border: "border-zinc-800" },
  ] as const

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[99] bg-black/20 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 320 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 320 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed bottom-0 right-0 top-0 z-[100] flex h-full w-80 flex-col shadow-2xl ${settings.theme === "dark" || settings.theme === "night"
              ? "bg-[#1f1f1f] text-zinc-200"
              : "bg-white text-slate-800"
              }`}
          >
            <div className="flex items-center justify-between border-b border-inherit px-6 py-4 opacity-80">
              <h2 className="font-serif text-lg font-medium">Reading Settings</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-current/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex flex-col gap-8">
                {/* Font Size */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium opacity-70">
                    <Type size={16} />
                    <span>Font Size</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(["small", "medium", "large", "xlarge"] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => updateSettings({ fontSize: size })}
                        className={`flex aspect-square items-center justify-center rounded-xl border transition-all ${settings.fontSize === size
                          ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "border-inherit hover:bg-current/5"
                          }`}
                      >
                        <span
                          className={
                            size === "small"
                              ? "text-xs"
                              : size === "medium"
                                ? "text-sm"
                                : size === "large"
                                  ? "text-base"
                                  : "text-lg"
                          }
                        >
                          Aa
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Family */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium opacity-70">
                    <Type size={16} />
                    <span>Font Family</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "serif", name: "Serif", font: "font-serif" },
                      { id: "sans", name: "Sans", font: "font-sans" },
                      { id: "mono", name: "Mono", font: "font-mono" },
                    ].map((font) => (
                      <button
                        key={font.id}
                        onClick={() => updateSettings({ fontFamily: font.id as any })}
                        className={`flex h-12 items-center justify-center rounded-xl border transition-all ${settings.fontFamily === font.id
                          ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "border-inherit hover:bg-current/5"
                          }`}
                      >
                        <span className={font.font}>{font.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium opacity-70">
                    <Sun size={16} />
                    <span>Theme</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => updateSettings({ theme: t.id as any })}
                        className={`group relative flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border transition-all ${settings.theme === t.id
                          ? "border-amber-500 ring-1 ring-amber-500"
                          : "border-inherit hover:border-amber-500/50"
                          }`}
                      >
                        <div
                          className={`h-8 w-8 rounded-full border shadow-sm ${t.color} ${t.border}`}
                        />
                        <span className="text-[10px] font-medium opacity-70 group-hover:opacity-100">
                          {t.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line Spacing */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium opacity-70">
                    <AlignLeft size={16} />
                    <span>Line Spacing</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "tight", name: "Tight" },
                      { id: "normal", name: "Normal" },
                      { id: "relaxed", name: "Relaxed" },
                    ].map((spacing) => (
                      <button
                        key={spacing.id}
                        onClick={() => updateSettings({ lineHeight: spacing.id as any })}
                        className={`flex h-10 items-center justify-center rounded-xl border transition-all ${settings.lineHeight === spacing.id
                          ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "border-inherit hover:bg-current/5"
                          }`}
                      >
                        <span className="text-sm font-medium">{spacing.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Margins */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium opacity-70">
                    <AlignJustify size={16} />
                    <span>Margins</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "narrow", name: "Narrow" },
                      { id: "normal", name: "Normal" },
                      { id: "wide", name: "Wide" },
                    ].map((margin) => (
                      <button
                        key={margin.id}
                        onClick={() => updateSettings({ margins: margin.id as any })}
                        className={`flex h-10 items-center justify-center rounded-xl border transition-all ${settings.margins === margin.id
                          ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "border-inherit hover:bg-current/5"
                          }`}
                      >
                        <span className="text-sm font-medium">{margin.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brightness */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium opacity-70">
                    <Sun size={16} />
                    <span>Brightness</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Minus size={16} className="opacity-50" />
                    <input
                      type="range"
                      min="20"
                      max="150"
                      step="5"
                      value={settings.brightness}
                      onChange={(e) => updateSettings({ brightness: parseInt(e.target.value) })}
                      className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-current opacity-20 accent-amber-500 hover:opacity-30"
                    />
                    <Plus size={16} className="opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
