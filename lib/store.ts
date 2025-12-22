// This file is kept for backwards compatibility with ambient sounds
// All book/stats data is now stored in Supabase

export const ambientSounds = [
  { id: "rain", name: "Rain", icon: "cloud-rain" },
  { id: "fire", name: "Fireplace", icon: "flame" },
  { id: "cafe", name: "Café", icon: "coffee" },
  { id: "forest", name: "Forest", icon: "tree-pine" },
  { id: "ocean", name: "Ocean", icon: "waves" },
  { id: "library", name: "Library", icon: "book-open" },
]

// Default reader settings (for non-authenticated users or initial state)
export const defaultReaderSettings = {
  fontSize: "medium" as const,
  fontFamily: "serif" as const,
  lineHeight: "normal" as const,
  theme: "light" as const,
  margins: "normal" as const,
  brightness: 100,
}
