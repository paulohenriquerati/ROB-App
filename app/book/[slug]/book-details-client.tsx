"use client";

import { GlobalNavBar } from "@/components/library/global-nav-bar";
import { Breadcrumb } from "@/components/library/breadcrumb";
import { BookHeader } from "@/components/library/book-header";
import { BookDescription } from "@/components/library/book-description";
import { RecommendationsGrid } from "@/components/library/recommendations-grid";
import { PublisherFooter } from "@/components/library/publisher-footer";
import { BookDetailsSidebar } from "@/components/library/book-details-sidebar";

interface Book {
    id: string;
    title: string;
    author: string;
    cover_url: string;
    description?: string;
    genre?: string;
    total_pages?: number;
    current_page?: number;
    pdf_url?: string;
    created_at: string;
}

interface Recommendation {
    id: string;
    title: string;
    author: string;
    cover_url: string;
    description?: string;
}

interface BookDetailsClientProps {
    book: Book;
    recommendations: Recommendation[];
}

export function BookDetailsClient({ book, recommendations }: BookDetailsClientProps) {
    return (
        <div className="min-h-screen bg-white">
            {/* Global Navigation Bar */}
            <GlobalNavBar />

            <div className="w-full px-6 sm:px-8 lg:px-14 py-2 mr-[396px] transition-all duration-300">
                {/* Breadcrumb Navigation */}
                <Breadcrumb bookTitle={book.title} />

                {/* Main Content */}
                <main className="max-w-4xl">
                    {/* BookHeader now includes cover, buttons, and metadata in proper layout */}
                    <BookHeader book={book} />
                    <BookDescription description={book.description} />
                    <RecommendationsGrid recommendations={recommendations} />
                    <PublisherFooter />
                </main>
            </div>

            {/* Fixed Sidebar - Docked to right edge */}
            <BookDetailsSidebar book={book} />
        </div>
    );
}
