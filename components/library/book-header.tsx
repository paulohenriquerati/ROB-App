"use client";

import { BookOpen } from "lucide-react";
import Image from "next/image";
import { MetadataList } from "./metadata-list";
import { ActionButtons } from "./action-buttons";
import { useState } from "react";

interface Book {
    id: string;
    title: string;
    author: string;
    cover_url: string;
    total_pages?: number;
    current_page?: number;
    genre?: string;
    created_at: string;
    pdf_url?: string;
}

interface BookHeaderProps {
    book: Book;
}

// Cover width constant for consistent sizing
const COVER_WIDTH = 320;

export function BookHeader({ book }: BookHeaderProps) {
    const [isAuthorHovered, setIsAuthorHovered] = useState(false);
    const coverUrl = book.cover_url || "/books2.png";

    // Calculate estimated reading time (assuming ~2 min per page)
    const totalMinutes = (book.total_pages || 0) * 2;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeToComplete = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return (
        <header className="mb-6">
            {/* Book Tag */}
            <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="w-4 h-4" style={{ color: "var(--oreilly-teal)" }} />
                <span
                    className="text-xs font-bold tracking-wide uppercase"
                    style={{ color: "var(--oreilly-teal)" }}
                >
                    BOOK
                </span>
            </div>

            {/* Title - Using Inter font (Google Sans alternative) */}
            <h1
                className="text-3xl lg:text-4xl font-semibold text-gray-600 mb-3"
                style={{ fontFamily: "var(--font-sans), sans-serif" }}
            >
                {book.title}
            </h1>

            {/* Meta Links - Separate lines, underlined with hover animation */}
            <div className="flex flex-col gap-1 text-sm mb-8">
                {/* Line 1: Write review - underlined */}
                <a
                    href="#"
                    className="text-[var(--oreilly-red)] underline transition-all duration-200 hover:text-[#8B0015]"
                    style={{ textDecorationThickness: "1px" }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecorationThickness = "2px"}
                    onMouseLeave={(e) => e.currentTarget.style.textDecorationThickness = "1px"}
                >
                    Write your first review
                </a>
                {/* Line 2: Author - underlined with hover animation */}
                <div className="mt-0 px-0 py-2">
                    <span className="text-gray-600">By </span>
                    <a
                        href="#"
                        className="underline font-bold transition-all duration-200"
                        style={{
                            color: isAuthorHovered ? "#8B0015" : "var(--oreilly-red)",
                            textDecorationThickness: isAuthorHovered ? "3px" : "2px",
                        }}
                        onMouseEnter={() => setIsAuthorHovered(true)}
                        onMouseLeave={() => setIsAuthorHovered(false)}
                    >
                        {book.author}
                    </a>
                </div>
            </div>

            {/* Hero Grid: Cover + Metadata */}
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column: Cover + Buttons - Fixed Width */}
                <div className="flex-shrink-0" style={{ width: COVER_WIDTH }}>
                    {/* Book Cover - Larger size */}
                    <div className="relative shadow-lg rounded-sm overflow-hidden border border-gray-200" style={{ width: COVER_WIDTH }}>
                        <Image
                            src={coverUrl}
                            alt={book.title}
                            width={COVER_WIDTH}
                            height={Math.round(COVER_WIDTH * 1.4)}
                            className="w-full h-auto"
                            priority
                            unoptimized
                        />
                    </div>

                    {/* Action Buttons - Same width as cover */}
                    <div className="mt-4" style={{ width: COVER_WIDTH }}>
                        <ActionButtons bookId={book.id} pdfUrl={book.pdf_url} coverWidth={COVER_WIDTH} />
                    </div>
                </div>

                {/* Right Column: Metadata */}
                <div className="flex-1">
                    <MetadataList
                        timeToComplete={timeToComplete}
                        totalPages={book.total_pages || 0}
                        genre={book.genre}
                        createdAt={book.created_at}
                    />
                </div>
            </div>
        </header>
    );
}
