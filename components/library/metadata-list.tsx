"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

interface MetadataListProps {
    timeToComplete: string;
    totalPages: number;
    genre?: string;
    createdAt?: string;
}

// Format date to "Month Year"
function formatPublicationDate(dateString?: string): string {
    if (!dateString) return "2026";

    const date = new Date(dateString);
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${month} ${year}`;
}

export function MetadataList({ timeToComplete, totalPages, genre, createdAt }: MetadataListProps) {
    const [hoveredLink, setHoveredLink] = useState<string | null>(null);
    const [isPlusHovered, setIsPlusHovered] = useState(false);

    const metadataItems = [
        { label: "TIME TO COMPLETE", value: timeToComplete },
        { label: "LEVEL", value: "Intermediate to advanced" },
        { label: "SKILLS", value: genre || "General", isLink: true, isUnderlined: true, isBold: true },
        { label: "PUBLISHED BY", value: "Tech Learn Inc.", isLink: true, isUnderlined: true, isBold: true },
        { label: "PUBLICATION DATE", value: formatPublicationDate(createdAt) },
        { label: "PRINT LENGTH", value: `${totalPages} pages` },
    ];

    return (
        <div className="space-y-3">
            {metadataItems.map((item) => (
                <div key={item.label} className="flex flex-col gap-0">
                    <span className="text-[14px] font-bold tracking-wider text-gray-900 uppercase">
                        {item.label}:
                    </span>
                    {item.isLink ? (
                        <a
                            href="#"
                            className={`text-sm transition-all duration-200 ease-in-out ${item.isUnderlined ? 'underline' : ''} ${item.isBold ? 'font-bold' : 'font-semibold'}`}
                            style={{
                                color: hoveredLink === item.label ? "#8B0015" : "#D31126",
                                textDecorationThickness: hoveredLink === item.label ? "2px" : "1px",
                            }}
                            onMouseEnter={() => setHoveredLink(item.label)}
                            onMouseLeave={() => setHoveredLink(null)}
                        >
                            {item.value}
                        </a>
                    ) : (
                        <span className="text-sm text-gray-800">{item.value}</span>
                    )}
                </div>
            ))}

            {/* Add to playlist action - With hover animation on + icon */}
            <button
                className="flex items-center gap-2 mt-3 font-bold text-sm transition-all duration-200 ease-in-out group"
                style={{ color: "#D31126" }}
                onMouseEnter={() => setIsPlusHovered(true)}
                onMouseLeave={() => setIsPlusHovered(false)}
            >
                <Plus
                    className="w-5 h-5 transition-transform duration-300 ease-out"
                    style={{
                        strokeWidth: 3,
                        transform: isPlusHovered ? "scale(1.2) rotate(90deg)" : "scale(1) rotate(0deg)",
                    }}
                />
                <span
                    className="transition-colors duration-200"
                    style={{ color: isPlusHovered ? "#8B0015" : "#D31126" }}
                >
                    Add to playlist
                </span>
            </button>
        </div>
    );
}
