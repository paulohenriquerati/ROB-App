"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion"
import { Flame, BookOpen, Clock, Target, TrendingUp, Award, Loader2, Info, Sparkles } from "lucide-react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import type { ReadingStats } from "@/lib/types"
import confetti from "canvas-confetti"

// ═══════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════
const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

// ═══════════════════════════════════════════════════════════════════
// COUNTUP HOOK
// ═══════════════════════════════════════════════════════════════════
function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (end === 0) {
      setCount(0)
      return
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      countRef.current = Math.round(eased * end)
      setCount(countRef.current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    startTimeRef.current = null
    requestAnimationFrame(animate)
  }, [end, duration])

  return count
}

// ═══════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════
export function StatsDashboard() {
  const { data: stats, isLoading: statsLoading } = useSWR<ReadingStats | null>("reading-stats", async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: stats, error } = await supabase.from("reading_stats").select("*").eq("user_id", user.id).single()

    if (error && error.code === "PGRST116") {
      const { data: newStats } = await supabase.from("reading_stats").insert({ user_id: user.id }).select().single()
      return newStats as ReadingStats
    }

    return stats as ReadingStats
  })

  const { data: weeklySessionsData } = useSWR("weekly-sessions", async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data } = await supabase
      .from("reading_sessions")
      .select("start_time, end_time, pages_read")
      .eq("user_id", user.id)
      .gte("start_time", weekAgo.toISOString())

    return data || []
  })

  const { data: booksData } = useSWR("books-stats", async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
      .from("books")
      .select("created_at, current_page, total_pages, rating")
      .eq("user_id", user.id)

    return data || []
  })

  const { data: todayData } = useSWR("today-reading", async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { minutes: 0 }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from("reading_sessions")
      .select("start_time, end_time")
      .eq("user_id", user.id)
      .gte("start_time", today.toISOString())

    const totalMinutes = (data || []).reduce((acc, session) => {
      if (session.start_time && session.end_time) {
        const duration = (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000
        return acc + duration
      }
      return acc
    }, 0)

    return { minutes: Math.round(totalMinutes) }
  })

  // Default stats
  const displayStats = stats || {
    total_books_read: 0,
    total_pages_read: 0,
    total_reading_time: 0,
    current_streak: 0,
    longest_streak: 0,
  }

  const dailyGoal = 30
  const todayMinutes = todayData?.minutes || 0

  // Process weekly data
  const weeklyData = (() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const result: { day: string; minutes: number; pages: number }[] = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayName = days[date.getDay()]

      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const daySessions = (weeklySessionsData || []).filter(s => {
        const sessionDate = new Date(s.start_time)
        return sessionDate >= dayStart && sessionDate <= dayEnd
      })

      const minutes = daySessions.reduce((acc, s) => {
        if (s.start_time && s.end_time) {
          return acc + (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000
        }
        return acc
      }, 0)

      const pages = daySessions.reduce((acc, s) => acc + (s.pages_read || 0), 0)
      result.push({ day: dayName, minutes: Math.round(minutes), pages })
    }

    return result
  })()

  // Calculate real stats
  const totalBooksRead = (booksData || []).filter(b => b.current_page >= b.total_pages).length
  const totalPagesRead = (booksData || []).reduce((acc, b) => acc + (b.current_page || 0), 0)
  const totalRatedBooks = (booksData || []).filter(b => b.rating > 0).length

  const realStats = {
    ...displayStats,
    total_books_read: totalBooksRead || displayStats.total_books_read,
    total_pages_read: totalPagesRead || displayStats.total_pages_read,
  }

  // Streak days calculation
  const streakDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return {
      day: date.toLocaleDateString("en", { weekday: "short" }),
      date: date.getDate(),
      active: i >= 7 - (displayStats.current_streak || 0),
    }
  })

  // Generate heatmap data (last 12 weeks)
  const heatmapData = (() => {
    const data: { date: Date; intensity: number }[] = []
    for (let i = 83; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      // Match with reading sessions for intensity
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const dayMinutes = (weeklySessionsData || [])
        .filter(s => {
          const sessionDate = new Date(s.start_time)
          return sessionDate >= dayStart && sessionDate <= dayEnd
        })
        .reduce((acc, s) => {
          if (s.start_time && s.end_time) {
            return acc + (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000
          }
          return acc
        }, 0)

      data.push({ date, intensity: Math.min(dayMinutes / 60, 4) }) // 0-4 scale
    }
    return data
  })()

  if (statsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 pb-12">
      {/* ═══════════════════════════════════════════════════════════════════
          BENTO GRID - HERO STATS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<AnimatedFlame streak={displayStats.current_streak} />}
          label="Current Streak"
          value={displayStats.current_streak}
          suffix="days"
          subtext={`Best: ${displayStats.longest_streak}`}
          color="amber"
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Books Read"
          value={realStats.total_books_read}
          subtext={`${realStats.total_pages_read.toLocaleString()} pages`}
          color="blue"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Reading Time"
          value={Math.round(displayStats.total_reading_time / 60)}
          suffix="hrs"
          subtext="Total hours"
          color="emerald"
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="Daily Goal"
          value={Math.round((todayMinutes / dailyGoal) * 100)}
          suffix="%"
          subtext={`${todayMinutes}/${dailyGoal} min`}
          color="violet"
          progress={(todayMinutes / dailyGoal) * 100}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BENTO GRID - MAIN CONTENT (Asymmetric)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
        {/* Weekly Activity - Spans 2 cols */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 lg:row-span-1 rounded-3xl border border-white/10 bg-card/80 p-6 backdrop-blur-xl shadow-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-semibold">Weekly Activity</h3>
              <p className="text-sm text-muted-foreground">Reading minutes per day</p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="gradientMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  dy={10}
                />
                <Tooltip content={<GlassTooltip />} />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fill="url(#gradientMinutes)"
                  dot={{ fill: "#f59e0b", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Streak Monitor */}
        <motion.div
          variants={itemVariants}
          className="lg:row-span-2 rounded-3xl border border-white/10 bg-card/80 p-6 backdrop-blur-xl shadow-xl"
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-serif text-xl font-semibold">Streak Monitor</h3>
            <AnimatedFlame streak={displayStats.current_streak} size="lg" />
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <div className="font-serif text-5xl font-bold tabular-nums text-amber-500">
                {displayStats.current_streak}
              </div>
              <p className="text-sm text-muted-foreground mt-1">day streak</p>
            </div>

            <div className="flex justify-between gap-1">
              {streakDays.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">{day.day[0]}</span>
                  <motion.div
                    animate={{
                      backgroundColor: day.active ? "hsl(var(--primary))" : "hsl(var(--secondary))",
                      scale: day.active ? 1.1 : 1,
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${day.active ? "text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground"
                      }`}
                  >
                    {day.active ? <Flame className="h-3.5 w-3.5 fill-current" /> : day.date}
                  </motion.div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-amber-500/10 p-4 border border-amber-500/20">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                  Read <span className="font-semibold">30 min</span> daily to keep your streak alive!
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Year Heatmap */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 rounded-3xl border border-white/10 bg-card/80 p-6 backdrop-blur-xl shadow-xl"
        >
          <div className="mb-4">
            <h3 className="font-serif text-xl font-semibold">Reading Heatmap</h3>
            <p className="text-sm text-muted-foreground">Last 12 weeks activity</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {heatmapData.map((day, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.005 }}
                className="h-4 w-4 rounded-sm"
                style={{
                  backgroundColor: day.intensity === 0
                    ? "hsl(var(--secondary))"
                    : `rgba(245, 158, 11, ${0.2 + day.intensity * 0.2})`,
                }}
                title={`${day.date.toLocaleDateString()}: ${Math.round(day.intensity * 60)} min`}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-3 w-3 rounded-sm"
                style={{
                  backgroundColor: i === 0
                    ? "hsl(var(--secondary))"
                    : `rgba(245, 158, 11, ${0.2 + i * 0.2})`,
                }}
              />
            ))}
            <span>More</span>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ACHIEVEMENTS
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-xl font-semibold">Achievements</h3>
          <span className="text-sm text-muted-foreground tabular-nums">
            {[displayStats.current_streak >= 7, realStats.total_books_read >= 10, totalRatedBooks >= 20, displayStats.longest_streak >= 30].filter(Boolean).length} of 4 unlocked
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AchievementBadge
            icon={<Flame className="h-6 w-6" />}
            title="Week Warrior"
            description="7-day streak"
            earned={displayStats.current_streak >= 7}
            progress={displayStats.current_streak < 7 ? (displayStats.current_streak / 7) * 100 : undefined}
            color="amber"
          />
          <AchievementBadge
            icon={<BookOpen className="h-6 w-6" />}
            title="Bookworm"
            description="Read 10 books"
            earned={realStats.total_books_read >= 10}
            progress={realStats.total_books_read < 10 ? (realStats.total_books_read / 10) * 100 : undefined}
            color="blue"
          />
          <AchievementBadge
            icon={<Award className="h-6 w-6" />}
            title="Critic"
            description="Rate 20 books"
            earned={totalRatedBooks >= 20}
            progress={totalRatedBooks < 20 ? (totalRatedBooks / 20) * 100 : undefined}
            color="yellow"
          />
          <AchievementBadge
            icon={<Target className="h-6 w-6" />}
            title="Consistent"
            description="30-day streak"
            earned={displayStats.longest_streak >= 30}
            progress={displayStats.longest_streak < 30 ? (displayStats.longest_streak / 30) * 100 : undefined}
            color="emerald"
          />
        </div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════
function StatCard({
  icon,
  label,
  value,
  suffix,
  subtext,
  color,
  progress,
}: {
  icon: React.ReactNode
  label: string
  value: number
  suffix?: string
  subtext?: string
  color: "amber" | "blue" | "emerald" | "violet"
  progress?: number
}) {
  const animatedValue = useCountUp(value)

  const colorMap = {
    amber: { bg: "bg-amber-500/10", text: "text-amber-500", glow: "shadow-amber-500/20" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", glow: "shadow-blue-500/20" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", glow: "shadow-emerald-500/20" },
    violet: { bg: "bg-violet-500/10", text: "text-violet-500", glow: "shadow-violet-500/20" },
  }

  const colors = colorMap[color]

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-card/80 p-5 backdrop-blur-xl shadow-lg transition-shadow hover:shadow-xl ${colors.glow}`}
    >
      {/* Glow Orb */}
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full ${colors.bg} blur-2xl transition-all group-hover:scale-150`} />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className={`rounded-2xl ${colors.bg} p-3 ${colors.text}`}>
            {icon}
          </div>
          {progress !== undefined && (
            <div className="relative h-10 w-10">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-secondary"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <motion.path
                  className={colors.text}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: Math.min(progress, 100) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-3xl font-bold tabular-nums">{animatedValue}</span>
            {suffix && <span className="text-sm font-medium text-muted-foreground">{suffix}</span>}
          </div>
          <p className="font-medium text-foreground">{label}</p>
          {subtext && <p className="mt-0.5 text-xs text-muted-foreground">{subtext}</p>}
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ANIMATED FLAME COMPONENT
// ═══════════════════════════════════════════════════════════════════
function AnimatedFlame({ streak, size = "md" }: { streak: number; size?: "md" | "lg" }) {
  const intensity = Math.min(streak / 7, 1) // 0-1 based on 7-day max

  return (
    <motion.div
      animate={{
        scale: [1, 1.1 + intensity * 0.1, 1],
        rotate: [0, -3, 3, 0],
      }}
      transition={{
        duration: 0.8 - intensity * 0.3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={size === "lg" ? "text-amber-500" : ""}
    >
      <Flame
        className={`${size === "lg" ? "h-7 w-7" : "h-5 w-5"} ${streak > 0 ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
          }`}
        style={{
          filter: streak > 0 ? `drop-shadow(0 0 ${4 + intensity * 8}px rgba(245, 158, 11, ${0.4 + intensity * 0.4}))` : undefined,
        }}
      />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// GLASS TOOLTIP
// ═══════════════════════════════════════════════════════════════════
function GlassTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-white/20 bg-black/60 px-4 py-2 text-sm shadow-2xl backdrop-blur-xl">
      <p className="font-semibold text-white">{payload[0].payload.day}</p>
      <p className="text-amber-400 tabular-nums">{payload[0].value} minutes</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ACHIEVEMENT BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════════
function AchievementBadge({
  icon,
  title,
  description,
  earned,
  progress,
  color,
}: {
  icon: React.ReactNode
  title: string
  description: string
  earned?: boolean
  progress?: number
  color: "amber" | "blue" | "yellow" | "emerald"
}) {
  const hasTriggeredConfetti = useRef(false)

  useEffect(() => {
    if (earned && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true
      // Trigger confetti for newly earned achievements
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"],
      })
    }
  }, [earned])

  const colorMap = {
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-500" },
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500" },
    yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-500" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-500" },
  }

  const colors = colorMap[color]

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.03, y: -2 }}
      className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${earned
          ? `${colors.bg} ${colors.border}`
          : "bg-card/50 border-border/30 grayscale opacity-60"
        }`}
    >
      {/* Shine Effect for Earned */}
      {earned && (
        <motion.div
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: "200%", opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
        />
      )}

      <div className="relative flex items-start gap-3">
        <div className={`rounded-full ${earned ? colors.bg : "bg-secondary"} p-2.5 ${earned ? colors.text : "text-muted-foreground"}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold leading-tight">{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>

          {progress !== undefined && !earned && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          )}

          {earned && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${colors.text}`}
            >
              <Sparkles className="h-3 w-3" />
              Unlocked
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
