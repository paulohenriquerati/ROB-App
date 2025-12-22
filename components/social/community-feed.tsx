"use client"

import { motion } from "framer-motion"
import { Heart, Share2, Quote, Star, BookOpen, Loader2 } from "lucide-react"
import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { SharedQuote, Review } from "@/lib/types"

type FeedTab = "quotes" | "reviews" | "activity"

export function CommunityFeed() {
  const [activeTab, setActiveTab] = useState<FeedTab>("quotes")
  const [likedQuotes, setLikedQuotes] = useState<Set<string>>(new Set())
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set())

  // Fetch quotes from Supabase
  const { data: quotes, isLoading: quotesLoading } = useSWR<SharedQuote[]>("shared-quotes", async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("shared_quotes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) throw error
    return data as SharedQuote[]
  })

  // Fetch reviews from Supabase
  const { data: reviews, isLoading: reviewsLoading } = useSWR<Review[]>("reviews", async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) throw error
    return data as Review[]
  })

  const toggleQuoteLike = (id: string) => {
    setLikedQuotes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleReviewLike = (id: string) => {
    setLikedReviews((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        {(["quotes", "reviews", "activity"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "quotes" && (
        <div className="space-y-4">
          {quotesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : quotes && quotes.length > 0 ? (
            quotes.map((quote, i) => (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex items-start gap-3">
                  <Quote className="mt-1 h-5 w-5 shrink-0 text-accent" />
                  <p className="font-serif text-lg italic leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
                </div>
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-medium text-foreground">{quote.book_title}</span>
                  <span>by {quote.author}</span>
                  <span className="text-muted-foreground/60">· p. {quote.page}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleQuoteLike(quote.id)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${
                        likedQuotes.has(quote.id) ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${likedQuotes.has(quote.id) ? "fill-current" : ""}`} />
                      {quote.likes + (likedQuotes.has(quote.id) ? 1 : 0)}
                    </button>
                    <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Shared by {quote.shared_by} · {formatDate(new Date(quote.created_at))}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground">No quotes shared yet. Be the first to share!</div>
          )}
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="space-y-4">
          {reviewsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reviews && reviews.length > 0 ? (
            reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex items-start gap-3">
                  <img
                    src={review.user_avatar || "/placeholder.svg?height=40&width=40&query=avatar"}
                    alt={review.user_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.user_name}</span>
                      <span className="text-xs text-muted-foreground">reviewed a book</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating ? "fill-accent text-accent" : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mb-4 text-foreground/90">{review.content}</p>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleReviewLike(review.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      likedReviews.has(review.id) ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${likedReviews.has(review.id) ? "fill-current" : ""}`} />
                    {review.likes + (likedReviews.has(review.id) ? 1 : 0)}
                  </button>
                  <span className="text-xs text-muted-foreground">{formatDate(new Date(review.created_at))}</span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground">No reviews yet. Be the first to review!</div>
          )}
        </div>
      )}

      {activeTab === "activity" && (
        <div className="space-y-3">
          <ActivityItem
            avatar="/professional-woman.png"
            name="Sarah M."
            action="finished reading"
            target="The Design of Everyday Things"
            time="2 hours ago"
          />
          <ActivityItem
            avatar="/professional-man.png"
            name="Alex K."
            action="started reading"
            target="Atomic Habits"
            time="5 hours ago"
          />
          <ActivityItem
            avatar="/casual-woman.png"
            name="Jamie L."
            action="rated"
            target="Clean Code"
            time="1 day ago"
            rating={5}
          />
          <ActivityItem
            avatar="/casual-man.png"
            name="Michael C."
            action="shared a quote from"
            target="Thinking, Fast and Slow"
            time="2 days ago"
          />
        </div>
      )}
    </div>
  )
}

function ActivityItem({
  avatar,
  name,
  action,
  target,
  time,
  rating,
}: {
  avatar: string
  name: string
  action: string
  target: string
  time: string
  rating?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 rounded-lg bg-card p-4 shadow-sm"
    >
      <img src={avatar || "/placeholder.svg"} alt={name} className="h-10 w-10 rounded-full object-cover" />
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-medium">{name}</span> <span className="text-muted-foreground">{action}</span>{" "}
          <span className="font-medium">{target}</span>
          {rating && (
            <span className="ml-2 inline-flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${star <= rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
                />
              ))}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </motion.div>
  )
}

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString("en", { month: "short", day: "numeric" })
}
