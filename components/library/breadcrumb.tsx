"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbProps {
    bookTitle: string;
}

export function Breadcrumb({ bookTitle }: BreadcrumbProps) {
    return (
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-[var(--oreilly-red)] transition-colors">
                Biblioteca
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/" className="hover:text-[var(--oreilly-red)] transition-colors">
                Livros
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-700 truncate max-w-xs">{bookTitle}</span>
        </nav>
    );
}
