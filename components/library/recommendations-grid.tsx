"use client";

import { BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Recommendation {
    id: string;
    title: string;
    author: string;
    cover_url: string;
    description?: string;
}

interface RecommendationsCardProps {
    recommendation: Recommendation;
}

function RecommendationsCard({ recommendation }: RecommendationsCardProps) {
    const coverUrl = recommendation.cover_url || "https://placehold.co/200x280/f5f5f5/333333?text=Book";

    return (
        <Link href={`/book/${recommendation.id}`} className="group cursor-pointer block">
            {/* Book Cover - Fixed aspect ratio container */}
            <div className="relative mb-3 overflow-hidden shadow-md transition-shadow group-hover:shadow-lg rounded-sm bg-gray-100" style={{ aspectRatio: '7/10' }}>
                <Image
                    src={coverUrl}
                    alt={recommendation.title}
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
            </div>

            {/* Badge */}
            <div className="flex items-center gap-1.5 mb-1">
                <BookOpen className="w-3.5 h-3.5" style={{ color: "var(--oreilly-teal)" }} />
                <span
                    className="text-xs font-bold tracking-wide uppercase"
                    style={{ color: "var(--oreilly-teal)" }}
                >
                    BOOK
                </span>
            </div>

            {/* Title - Fixed height with line clamp */}
            <h3 className="font-bold text-sm leading-tight text-gray-900 mb-1 group-hover:text-[var(--oreilly-red)] transition-colors line-clamp-2 min-h-[2.5rem]">
                {recommendation.title}
            </h3>

            {/* Author */}
            <p className="text-xs text-gray-600 mb-2 truncate">By {recommendation.author}</p>

            {/* Description - Fixed height */}
            <p className="text-xs text-gray-500 line-clamp-3 min-h-[3rem]">
                {recommendation.description || "Este trabalho foi traduzido com recurso a IA. Agradecemos o teu feedback e comentários..."}
            </p>
        </Link>
    );
}

interface RecommendationsGridProps {
    recommendations: Recommendation[];
}

export function RecommendationsGrid({ recommendations }: RecommendationsGridProps) {
    if (recommendations.length === 0) {
        return null;
    }

    return (
        <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Também podes gostar</h2>
            {/* Strict 4-column grid with consistent gutters */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {recommendations.slice(0, 4).map((rec) => (
                    <RecommendationsCard
                        key={rec.id}
                        recommendation={rec}
                    />
                ))}
            </div>
        </section>
    );
}
