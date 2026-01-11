"use client";

import { CalendarPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface ActionButtonsProps {
    bookId: string;
    pdfUrl?: string;
    coverWidth?: number;
}

// Key for storing reading progress in localStorage
const READING_PROGRESS_KEY = "reading_progress";

export function ActionButtons({ bookId, pdfUrl, coverWidth = 280 }: ActionButtonsProps) {
    const router = useRouter();
    const [isScheduleHovered, setIsScheduleHovered] = useState(false);
    const [isReading, setIsReading] = useState(false);
    const [readingProgress, setReadingProgress] = useState(0);

    // Check if user has reading progress for this book
    useEffect(() => {
        try {
            const storedProgress = localStorage.getItem(READING_PROGRESS_KEY);
            if (storedProgress) {
                const progressData = JSON.parse(storedProgress);
                if (progressData[bookId]) {
                    setIsReading(true);
                    setReadingProgress(progressData[bookId].percentage || 0);
                }
            }
        } catch (error) {
            console.error("Error reading progress from localStorage:", error);
        }
    }, [bookId]);

    const handleStart = () => {
        // Save reading progress to localStorage
        try {
            const storedProgress = localStorage.getItem(READING_PROGRESS_KEY);
            const progressData = storedProgress ? JSON.parse(storedProgress) : {};

            if (!progressData[bookId]) {
                progressData[bookId] = {
                    startedAt: new Date().toISOString(),
                    percentage: 0,
                    lastReadAt: new Date().toISOString(),
                    pdfUrl: pdfUrl,
                };
            } else {
                progressData[bookId].lastReadAt = new Date().toISOString();
            }

            localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(progressData));
        } catch (error) {
            console.error("Error saving progress to localStorage:", error);
        }

        // Navigate to the in-app reader page
        router.push(`/read/${bookId}`);
    };

    return (
        <div className="flex flex-col gap-3" style={{ width: coverWidth }}>
            {/* Primary Start/Continue Button - Fixed width */}
            <button
                onClick={handleStart}
                className="w-full py-3 px-6 rounded-sm font-bold text-white text-center transition-all duration-200 ease-in-out hover:shadow-md cursor-pointer"
                style={{
                    backgroundColor: "var(--oreilly-red)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--oreilly-red-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--oreilly-red)"}
            >
                {isReading ? (
                    <span className="flex items-center justify-center gap-2">
                        Continue
                        {readingProgress > 0 && (
                            <span className="text-sm opacity-80">({readingProgress}%)</span>
                        )}
                    </span>
                ) : (
                    "Start"
                )}
            </button>

            {/* Secondary Schedule Button - With hover animation */}
            <button
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-sm font-bold text-center border-2 transition-all duration-200 ease-in-out cursor-pointer"
                style={{
                    borderColor: "var(--oreilly-red)",
                    color: "var(--oreilly-red)",
                    backgroundColor: isScheduleHovered ? "rgba(211, 17, 38, 0.05)" : "white",
                }}
                onMouseEnter={() => setIsScheduleHovered(true)}
                onMouseLeave={() => setIsScheduleHovered(false)}
            >
                <CalendarPlus className="w-5 h-5 transition-transform duration-200" />
                Schedule learning reminder
            </button>
        </div>
    );
}
