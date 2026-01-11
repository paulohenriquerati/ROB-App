import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ReaderClient } from "./reader-client";

interface ReaderPageProps {
    params: Promise<{
        bookId: string;
    }>;
}

export default async function ReaderPage({ params }: ReaderPageProps) {
    const resolvedParams = await params;
    const bookId = resolvedParams.bookId;

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

    return <ReaderClient book={book} />;
}
