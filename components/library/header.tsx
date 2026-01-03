"use client"

import { motion } from "framer-motion"
import { Moon, Sun, BarChart2, Users, Library, LogOut, User, Search, X } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface LibraryHeaderProps {
  activeView?: "library" | "stats" | "community"
  onViewChange?: (view: "library" | "stats" | "community") => void
  onSearch?: (query: string) => void
  searchQuery?: string
}

export function LibraryHeader({
  activeView = "library",
  onViewChange,
  onSearch,
  searchQuery = ""
}: LibraryHeaderProps) {
  const [isDark, setIsDark] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const dark = document.documentElement.classList.contains("dark")
    setIsDark(dark)
  }, [])

  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark")
    setIsDark(!isDark)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    onSearch?.(value)
  }

  const navItems = [
    { id: "library" as const, label: "Library", icon: Library },
    { id: "stats" as const, label: "Statistics", icon: BarChart2 },
    { id: "community" as const, label: "Community", icon: Users },
  ]

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 w-full"
    >
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border-b border-black/[0.04] dark:border-white/[0.04]" />

      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20 overflow-hidden">
            <img src="/books1.png" alt="Biblioteca" className="h-7 w-7 object-contain" />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight">Biblioteca</span>
        </motion.div>

        {/* Center Nav - Animated Sliding Indicator */}
        <nav className="hidden items-center gap-1 md:flex relative">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => onViewChange?.(item.id)}
                className="relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
              >
                {/* Sliding Background Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-full bg-black/[0.06] dark:bg-white/[0.08]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <span className={`relative z-10 flex items-center gap-2 ${isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                  }`}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>

                {/* Active Glow Dot */}
                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-amber-500 shadow-[0_0_6px_2px_rgba(245,158,11,0.4)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* Right Side - Search & Actions */}
        <div className="flex items-center gap-2">
          {/* Expanding Search */}
          <motion.div
            animate={{
              width: isSearchFocused ? 240 : 160,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`relative flex items-center rounded-full border transition-all duration-200 ${isSearchFocused
                ? "bg-white dark:bg-zinc-800 border-border shadow-lg"
                : "bg-transparent border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
              }`}
          >
            <Search className={`absolute left-3 h-4 w-4 transition-colors ${isSearchFocused ? "text-muted-foreground" : "text-muted-foreground/60"
              }`} />
            <input
              ref={searchInputRef}
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search books..."
              className="h-9 w-full bg-transparent pl-9 pr-8 text-sm placeholder:text-muted-foreground/50 focus:outline-none"
            />
            {localSearch && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-2 p-1 rounded-full hover:bg-secondary"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </motion.div>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.05] hover:text-foreground"
            aria-label="Toggle theme"
          >
            <motion.div
              animate={{ rotate: isDark ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </motion.div>
          </motion.button>

          {/* Profile Dropdown */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 ring-2 ring-amber-500/20"
                >
                  <User className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 mt-2 rounded-xl border border-white/20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl"
              >
                <div className="px-3 py-2">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Signed in</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg mx-1"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/auth/login")}
              className="rounded-full"
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  )
}
