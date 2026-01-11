"use client";

import { BookReader } from "@/components/reader/book-reader";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCallback } from "react";

interface Book {
    id: string;
    title: string;
    author: string;
    cover_url: string;
    pdf_url?: string;
    total_pages?: number;
    current_page?: number;
    genre?: string;
    created_at: string;
    description?: string;
    rating?: number;
}

interface ReaderClientProps {
    book: Book;
}

export function ReaderClient({ book }: ReaderClientProps) {
    const router = useRouter();

    const handleClose = useCallback(() => {
        // Navigate back to the book details page
        router.push(`/book/${book.id}`);
    }, [router, book.id]);

    const handlePageChange = useCallback(async (page: number) => {
        const supabase = createClient();
        await supabase
            .from("books")
            .update({
                current_page: page,
                last_read: new Date().toISOString(),
            })
            .eq("id", book.id);
    }, [book.id]);

    // Format book for BookReader component
    const formattedBook = {
        ...book,
        coverUrl: book.cover_url,
        totalPages: book.total_pages || 0,
        currentPage: book.current_page || 1,
        pdfUrl: book.pdf_url,
    };

    return (
        <BookReader
            book={formattedBook as any}
            onClose={handleClose}
            onPageChange={handlePageChange}
        />
    );
}
