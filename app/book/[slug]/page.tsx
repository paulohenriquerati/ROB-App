import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BookDetailsClient } from "./book-details-client";

interface BookDetailsPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function BookDetailsPage({ params }: BookDetailsPageProps) {
    const resolvedParams = await params;
    const bookId = resolvedParams.slug;

    const supabase = await createClient();

    // Fetch the book data
    const { data: book, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", bookId)
        .single();

    if (error || !book) {
        notFound();
    }

    // Fetch recommendations (other books by same author or in same genre)
    const { data: recommendations } = await supabase
        .from("books")
        .select("id, title, author, cover_url, description")
        .neq("id", bookId)
        .limit(4);

    return (
        <BookDetailsClient
            book={book}
            recommendations={recommendations || []}
        />
    );
}
