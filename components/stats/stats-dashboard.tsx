"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Flame, BookOpen, Clock, Target, TrendingUp, Award, Calendar, Loader2, Info } from "lucide-react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Cell } from "recharts"
import type { ReadingStats } from "@/lib/types"

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

export function StatsDashboard() {
  const { data: stats, isLoading: statsLoading } = useSWR<ReadingStats | null>("reading-stats", async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: stats, error } = await supabase.from("reading_stats").select("*").eq("user_id", user.id).single()

    if (error && error.code === "PGRST116") {
      const { data: newStats } = await supabase.from("reading_stats").insert({ user_id: user.id }).select().single()
      return newStats as ReadingStats
    }

    return stats as ReadingStats
  })

  // Fetch weekly reading sessions from database
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

  // Fetch books data for yearly chart
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

  // Fetch today's reading time
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

  // Default stats for display
  const displayStats = stats || {
    total_books_read: 0,
    total_pages_read: 0,
    total_reading_time: 0,
    current_streak: 0,
    longest_streak: 0,
  }

  const dailyGoal = 30
  const todayMinutes = todayData?.minutes || 0

  // Process weekly data from sessions
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

  // Process monthly data from books
  const monthlyData = (() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentYear = new Date().getFullYear()

    return months.map((month, index) => {
      const booksInMonth = (booksData || []).filter(book => {
        const createdAt = new Date(book.created_at)
        // Count as "read" if they've started reading (current_page > 0) or completed
        return createdAt.getFullYear() === currentYear &&
          createdAt.getMonth() === index &&
          (book.current_page > 0 || book.current_page >= book.total_pages)
      }).length

      return { month, books: booksInMonth }
    })
  })()

  // Calculate total books and pages from actual data
  const totalBooksRead = (booksData || []).filter(b => b.current_page >= b.total_pages).length
  const totalPagesRead = (booksData || []).reduce((acc, b) => acc + (b.current_page || 0), 0)
  const totalRatedBooks = (booksData || []).filter(b => b.rating > 0).length

  // Override displayStats with real calculated data
  const realStats = {
    ...displayStats,
    total_books_read: totalBooksRead || displayStats.total_books_read,
    total_pages_read: totalPagesRead || displayStats.total_pages_read,
  }

  const isLoading = statsLoading

  const streakDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return {
      day: date.toLocaleDateString("en", { weekday: "short" }),
      date: date.getDate(),
      active: i >= 7 - (displayStats.current_streak || 0),
    }
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 pb-12">
      {/* Hero Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          label="Current Streak"
          value={displayStats.current_streak}
          suffix="days"
          subtext={`Best: ${displayStats.longest_streak}`}
          gradient="from-orange-500/10 to-red-500/10"
          iconColor="text-orange-500"
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Books Read"
          value={realStats.total_books_read}
          subtext={`${realStats.total_pages_read.toLocaleString()} pages total`}
          gradient="from-blue-500/10 to-cyan-500/10"
          iconColor="text-blue-500"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Reading Time"
          value={formatTime(displayStats.total_reading_time)}
          subtext="Total hours"
          gradient="from-emerald-500/10 to-teal-500/10"
          iconColor="text-emerald-500"
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="Daily Goal"
          value={Math.round((todayMinutes / dailyGoal) * 100)}
          suffix="%"
          subtext={`${todayMinutes}/${dailyGoal} minutes`}
          gradient="from-violet-500/10 to-purple-500/10"
          iconColor="text-violet-500"
          progress={(todayMinutes / dailyGoal) * 100}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Activity Chart */}
        <motion.div variants={itemVariants} className="col-span-2 rounded-2xl border bg-card/50 p-6 backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-medium">Weekly Activity</h3>
              <p className="text-sm text-muted-foreground">Your reading habits over the last 7 days</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-2 text-muted-foreground">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  hide
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--secondary))", opacity: 0.4 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-xl">
                          <p className="font-medium">{payload[0].payload.day}</p>
                          <p className="text-amber-500">{payload[0].value} minutes</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                  dataKey="minutes"
                  radius={[4, 4, 4, 4]}
                >
                  {weeklyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 5 ? "hsl(var(--primary))" : "hsl(var(--secondary))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Streak Monitor */}
        <motion.div variants={itemVariants} className="rounded-2xl border bg-card/50 p-6 backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-serif text-xl font-medium">Streak Monitor</h3>
            <Flame className={`h-5 w-5 ${displayStats.current_streak > 0 ? "text-orange-500 fill-orange-500" : "text-muted-foreground"}`} />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">Current Streak</div>
              <div className="text-2xl font-bold font-serif">{displayStats.current_streak} <span className="text-sm font-sans font-normal text-muted-foreground">days</span></div>
            </div>

            <div className="flex justify-between">
              {streakDays.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">{day.day[0]}</div>
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: day.active ? "hsl(var(--primary))" : "transparent",
                      scale: day.active ? 1.1 : 1,
                      borderColor: day.active ? "transparent" : "hsl(var(--border))"
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors ${day.active ? "text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground bg-secondary/30"
                      }`}
                  >
                    {day.active ? <Flame className="h-3.5 w-3.5 fill-current" /> : day.date}
                  </motion.div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-orange-500/5 p-4 border border-orange-500/10">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-orange-600 shrink-0" />
                <p className="text-xs leading-relaxed text-orange-900/80 dark:text-orange-200/80">
                  Read for at least <span className="font-semibold">30 minutes</span> today to keep your streak alive!
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Annual Overview */}
        <motion.div variants={itemVariants} className="lg:col-span-3 rounded-2xl border bg-card/50 p-6 backdrop-blur-sm">
          <div className="mb-6">
            <h3 className="font-serif text-xl font-medium">Year in Books</h3>
            <p className="text-sm text-muted-foreground">Monthly breakdown of your reading journey</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorBooks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  dy={10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    padding: "8px 12px"
                  }}
                  cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="books"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorBooks)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Achievements Section */}
      <motion.div variants={itemVariants}>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-serif text-xl font-medium">Achievements</h3>
          <span className="text-sm text-muted-foreground">
            {[displayStats.current_streak >= 7, realStats.total_books_read >= 10, totalRatedBooks >= 20, displayStats.longest_streak >= 30].filter(Boolean).length} of 4 unlocked
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Achievement
            icon={<Flame className="h-6 w-6 text-orange-500" />}
            title="Week Warrior"
            description="7-day reading streak"
            earned={displayStats.current_streak >= 7}
            progress={displayStats.current_streak < 7 ? (displayStats.current_streak / 7) * 100 : undefined}
            bg="bg-orange-500/10"
            border="border-orange-500/20"
          />
          <Achievement
            icon={<BookOpen className="h-6 w-6 text-blue-500" />}
            title="Bookworm"
            description="Read 10 books"
            earned={realStats.total_books_read >= 10}
            progress={realStats.total_books_read < 10 ? (realStats.total_books_read / 10) * 100 : undefined}
            bg="bg-blue-500/10"
            border="border-blue-500/20"
          />
          <Achievement
            icon={<Award className="h-6 w-6 text-yellow-500" />}
            title="Critic"
            description="Rate 20 books"
            earned={totalRatedBooks >= 20}
            progress={totalRatedBooks < 20 ? (totalRatedBooks / 20) * 100 : undefined}
            bg="bg-yellow-500/10"
            border="border-yellow-500/20"
          />
          <Achievement
            icon={<Target className="h-6 w-6 text-emerald-500" />}
            title="Consistent"
            description="30-day streak"
            earned={displayStats.longest_streak >= 30}
            progress={displayStats.longest_streak < 30 ? (displayStats.longest_streak / 30) * 100 : undefined}
            bg="bg-emerald-500/10"
            border="border-emerald-500/20"
          />
        </div>
      </motion.div>
    </motion.div>
  )
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  subtext,
  gradient,
  iconColor,
  progress,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  suffix?: string
  subtext?: string
  gradient: string
  iconColor: string
  progress?: number
}) {
  return (
    <motion.div variants={itemVariants} className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} blur-2xl transition-all group-hover:scale-150`} />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className={`rounded-xl bg-secondary/50 p-2.5 ${iconColor}`}>
            {icon}
          </div>
          {progress !== undefined && (
            <div className="relative h-10 w-10">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  className="text-secondary"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <motion.path
                  className={iconColor}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: progress / 100 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-3xl font-bold">{value}</span>
            {suffix && <span className="text-sm font-medium text-muted-foreground">{suffix}</span>}
          </div>
          <p className="font-medium text-foreground">{label}</p>
          {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
        </div>
      </div>
    </motion.div>
  )
}

function Achievement({
  icon,
  title,
  description,
  earned,
  progress,
  bg,
  border
}: {
  icon: React.ReactNode
  title: string
  description: string
  earned?: boolean
  progress?: number
  bg: string
  border: string
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden rounded-xl border p-4 transition-all ${earned ? `${bg} ${border}` : "bg-card border-border/50 opacity-80 hover:opacity-100"
        }`}
    >
      <div className="flex items-start gap-4">
        <div className={`rounded-full bg-background/80 p-2 shadow-sm ${!earned && "grayscale"}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-medium leading-none">{title}</h4>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>

          {progress !== undefined && !earned && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-primary"
              />
            </div>
          )}

          {earned && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mt-2 text-[10px] font-bold uppercase tracking-wider text-primary"
            >
              Unlocked
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  if (hours < 1) return `${minutes}`
  return `${hours}.${minutes % 60}`
}
