"use client";

import { List, X, Sparkles } from "lucide-react";
import { useState } from "react";

interface Book {
    id: string;
    title: string;
    author: string;
}

interface BookDetailsSidebarProps {
    book: Book;
}

// Localized table of contents in Portuguese
const tableOfContents = [
    "Prefácio",
    "1. Introdução",
    "2. Conceitos Fundamentais",
    "3. Primeiros Passos",
    "4. Tópicos Avançados",
    "5. Boas Práticas",
    "6. Exemplos Reais",
    "7. Resolução de Problemas",
    "8. Conclusão",
];

export function BookDetailsSidebar({ book }: BookDetailsSidebarProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isCloseHovered, setIsCloseHovered] = useState(false);
    const [isTocHovered, setIsTocHovered] = useState(false);
    const [isAiHovered, setIsAiHovered] = useState(false);

    // Icon rail width
    const ICON_RAIL_WIDTH = 56;
    // Sidebar content width
    const SIDEBAR_WIDTH = 340;

    return (
        <>
            {/* Floating Icon Rail - Outside the sidebar border */}
            <div
                className="fixed top-[72px] h-[calc(100vh-72px)] bg-white z-40 flex flex-col items-end pt-6 gap-6 transition-all duration-300 ease-out"
                style={{
                    width: isExpanded ? "auto" : `${ICON_RAIL_WIDTH}px`,
                    right: isExpanded ? `${SIDEBAR_WIDTH}px` : "0px",
                    paddingLeft: isExpanded ? "16px" : "0px",
                    paddingRight: isExpanded ? "8px" : "0px",
                }}
            >
                {/* AI Sparkle Icon - Purple with Hover Animation */}
                <div
                    className="flex items-center relative"
                    onMouseEnter={() => setIsAiHovered(true)}
                    onMouseLeave={() => setIsAiHovered(false)}
                >
                    {/* Tooltip Label - Appears to the LEFT on hover */}
                    <div
                        className={`absolute right-full mr-2 flex items-center transition-all duration-200 ease-out ${isAiHovered
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 translate-x-2 pointer-events-none'
                            }`}
                    >
                        <span className="bg-gray-900 text-white text-sm font-medium px-3 py-2 rounded whitespace-nowrap flex items-center gap-1">
                            Get the <Sparkles className="w-3 h-3" style={{ color: "#8C52FF" }} /><span style={{ color: "#8C52FF" }}>Answers</span> you need
                        </span>
                        {/* Arrow pointer pointing right */}
                        <div
                            className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-gray-900"
                        />
                    </div>

                    {/* AI Button - Purple icon with hover effect */}
                    <button
                        className="w-10 h-10 flex items-center justify-center rounded transition-all duration-200"
                        style={{ backgroundColor: isAiHovered ? "#F3E8FF" : "transparent" }}
                    >
                        <Sparkles
                            className="w-6 h-6 transition-transform duration-200"
                            style={{
                                color: "#8C52FF",
                                transform: isAiHovered ? "scale(1.1)" : "scale(1)"
                            }}
                        />
                    </button>
                </div>

                {/* Menu/TOC Icon - Gray Default, Red + Tooltip on Hover */}
                <div
                    className="flex items-center relative"
                    onMouseEnter={() => setIsTocHovered(true)}
                    onMouseLeave={() => setIsTocHovered(false)}
                >
                    {/* Tooltip Label - Appears to the LEFT on hover */}
                    <div
                        className={`absolute right-full mr-2 flex items-center transition-all duration-200 ease-out ${isTocHovered
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 translate-x-2 pointer-events-none'
                            }`}
                    >
                        <span className="bg-gray-900 text-white text-sm font-medium px-2 py-3 rounded whitespace-nowrap">
                            Table of contents
                        </span>
                        {/* Arrow pointer pointing right */}
                        <div
                            className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-gray-900"
                        />
                    </div>

                    {/* Toggle Button - Gray default, Red on hover */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-10 h-10 flex items-center justify-center rounded transition-all duration-200"
                        style={{ backgroundColor: isTocHovered ? "#D31126" : "#E5E7EB" }}
                        aria-label={isExpanded ? "Collapse table of contents" : "Expand table of contents"}
                    >
                        <List
                            className="w-5 h-5 transition-colors duration-200"
                            style={{ color: isTocHovered ? "#FFFFFF" : "#374151" }}
                        />
                    </button>
                </div>
            </div>

            {/* Sidebar Content Panel */}
            <aside
                className="fixed right-0 top-[72px] h-[calc(100vh-72px)] bg-white z-40 transition-all duration-300 ease-out overflow-hidden"
                style={{
                    width: isExpanded ? `${SIDEBAR_WIDTH}px` : "0px",
                    borderLeft: isExpanded ? "3px solid #e4e2e2ff" : "none",
                }}
            >
                {isExpanded && (
                    <div className="h-full flex flex-col px-5 pt-4 pb-6 overflow-hidden relative">
                        {/* Close Button - Top Right with Red Border Hover */}
                        <button
                            className="absolute top-4 right-4 p-1 rounded transition-all duration-200 ease-in-out"
                            style={{
                                border: isCloseHovered ? "2px solid #D31126" : "2px solid transparent",
                            }}
                            onClick={() => setIsExpanded(false)}
                            onMouseEnter={() => setIsCloseHovered(true)}
                            onMouseLeave={() => setIsCloseHovered(false)}
                            aria-label="Close table of contents"
                        >
                            <X
                                className="w-5 h-5 transition-colors duration-200"
                                style={{
                                    color: isCloseHovered ? "#D31126" : "#374151",
                                    strokeWidth: 2.5
                                }}
                            />
                        </button>

                        {/* Title and List Icon */}
                        <div className="flex items-start justify-between mb-2 pr-10 mt-10">
                            <h2
                                className="font-semibold text-xl text-gray-900 leading-tight"
                                style={{ fontFamily: "var(--font-sans), sans-serif" }}
                            >
                                {book.title}
                            </h2>
                            <List className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                        </div>

                        {/* Authors - Red underlined text */}
                        <p className="text-sm mb-8">
                            <span className="text-gray-600">Por </span>
                            <a
                                href="#"
                                className="text-[var(--oreilly-red)] underline hover:text-[#8B0015] transition-colors"
                                style={{ textDecorationThickness: "1px" }}
                            >
                                {book.author}
                            </a>
                        </p>

                        {/* Table of Contents - Airy spacing */}
                        <nav className="flex-1 overflow-y-auto">
                            {tableOfContents.map((item, index) => (
                                <a
                                    key={index}
                                    href="#"
                                    className="block text-base text-gray-700 hover:text-[var(--oreilly-red)] transition-colors mb-6 leading-relaxed"
                                    style={{ fontFamily: "var(--font-sans), sans-serif" }}
                                >
                                    {item}
                                </a>
                            ))}
                        </nav>
                    </div>
                )}
            </aside>
        </>
    );
}
