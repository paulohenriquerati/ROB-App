"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, User, Menu, Sparkles, ChevronRight, CircleArrowRight } from "lucide-react";
import { useState } from "react";

// Tech Blue color for hover state
const TECH_BLUE = "#0070E0";

// Skill categories for Explore Skills dropdown
const skillCategories = [
    "Cloud Computing",
    "Data Engineering",
    "Data Science",
    "AI & ML",
    "Programming Languages",
    "Software Architecture",
    "IT/Ops",
    "Security",
    "Design",
    "Business",
    "Soft Skills",
];

export function GlobalNavBar() {
    const [hoveredNav, setHoveredNav] = useState<string | null>(null);
    const [isSubscribeHovered, setIsSubscribeHovered] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isExploreOpen, setIsExploreOpen] = useState(false);
    const [isStartLearningOpen, setIsStartLearningOpen] = useState(false);
    const [isFeaturedOpen, setIsFeaturedOpen] = useState(false);
    const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

    const navItems = ["Explore Skills", "Start Learning", "Featured", "Answers"];

    return (
        <header className="w-full bg-white border-b-3 border-gray-100 sticky top-0 z-50">
            <div className="w-full px-10 sm:px-8 lg:px-8">
                {/* Root Container: Two-Group Flexbox with space-between */}
                <div className="flex items-center justify-between h-18">

                    {/* LEFT SIDE: Logo + Navigation Links */}
                    <div className="flex items-center gap-4 -ml-10 sm:-ml-8 lg:-ml-4">
                        {/* Logo - TechLearn Brand */}
                        <Link href="/" className="flex items-center flex-shrink-0">
                            <Image
                                src="/techlearn.png"
                                alt="TechLearn Platform"
                                width={140}
                                height={36}
                                className="h-16 w-auto object-contain"
                                priority
                            />
                        </Link>

                        {/* Nav Links - With blue border hover animation */}
                        <nav className="hidden md:flex items-center gap-6">
                            {navItems.map((item) => (
                                <div key={item} className="relative">
                                    {item === "Explore Skills" ? (
                                        // Explore Skills with Dropdown (Click to open)
                                        <div
                                            onMouseEnter={() => setHoveredNav(item)}
                                            onMouseLeave={() => setHoveredNav(null)}
                                        >
                                            <button
                                                onClick={() => {
                                                    setIsExploreOpen(!isExploreOpen);
                                                    setIsStartLearningOpen(false);
                                                    setIsFeaturedOpen(false);
                                                }}
                                                className="text-base font-bold px-3 py-1.5 rounded transition-all duration-200 ease-in-out flex items-center gap-1 cursor-pointer"
                                                style={{
                                                    color: (hoveredNav === item || isExploreOpen) ? TECH_BLUE : "#374151",
                                                    backgroundColor: "white",
                                                    border: (hoveredNav === item || isExploreOpen) ? "1px solid #0062ffff" : "1px solid transparent",
                                                }}
                                            >
                                                {item}
                                            </button>

                                            {/* Dropdown Menu */}
                                            {isExploreOpen && (
                                                <div
                                                    className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[280px] z-50"
                                                    style={{
                                                        animation: "fadeIn 0.15s ease-out",
                                                    }}
                                                >
                                                    {skillCategories.map((skill) => (
                                                        <Link
                                                            key={skill}
                                                            href="#"
                                                            className="flex items-center justify-between px-4 py-3 transition-colors duration-150 cursor-pointer"
                                                            style={{
                                                                color: hoveredSkill === skill ? "#D31126" : "#374151",
                                                                backgroundColor: hoveredSkill === skill ? "#FEF2F2" : "transparent",
                                                            }}
                                                            onMouseEnter={() => setHoveredSkill(skill)}
                                                            onMouseLeave={() => setHoveredSkill(null)}
                                                        >
                                                            <span className="text-base font-medium">{skill}</span>
                                                            <ChevronRight
                                                                className="w-4 h-4"
                                                                style={{ color: hoveredSkill === skill ? "#D31126" : "#9CA3AF" }}
                                                            />
                                                        </Link>
                                                    ))}

                                                    {/* View All Link */}
                                                    <div className="border-t border-gray-100 mt-2 pt-2">
                                                        <Link
                                                            href="#"
                                                            className="flex items-center gap-2 px-4 py-3 text-base font-medium transition-colors duration-150 cursor-pointer"
                                                            style={{ color: TECH_BLUE }}
                                                        >
                                                            <CircleArrowRight className="w-5 h-5" />
                                                            View all
                                                        </Link>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : item === "Start Learning" ? (
                                        // Start Learning with Dropdown (Click to open)
                                        <div
                                            onMouseEnter={() => setHoveredNav(item)}
                                            onMouseLeave={() => setHoveredNav(null)}
                                        >
                                            <button
                                                onClick={() => {
                                                    setIsStartLearningOpen(!isStartLearningOpen);
                                                    setIsExploreOpen(false);
                                                    setIsFeaturedOpen(false);
                                                }}
                                                className="text-base font-bold px-3 py-1.5 rounded transition-all duration-200 ease-in-out flex items-center gap-1 cursor-pointer"
                                                style={{
                                                    color: (hoveredNav === item || isStartLearningOpen) ? TECH_BLUE : "#374151",
                                                    backgroundColor: "white",
                                                    border: (hoveredNav === item || isStartLearningOpen) ? "1px solid #0062ffff" : "1px solid transparent",
                                                }}
                                            >
                                                {item}
                                            </button>

                                            {/* Dropdown Menu */}
                                            {isStartLearningOpen && (
                                                <div
                                                    className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-3 min-w-[280px] z-50"
                                                    style={{
                                                        animation: "fadeIn 0.15s ease-out",
                                                    }}
                                                >
                                                    {/* Live Events Section */}
                                                    <div className="px-4 pb-3 border-b border-gray-100">
                                                        <span className="text-base font-bold text-gray-900">Live events</span>
                                                        <div className="flex gap-4 mt-2">
                                                            <Link href="#" className="text-sm text-blue-600 hover:underline cursor-pointer">All events</Link>
                                                            <Link href="#" className="text-sm text-blue-600 hover:underline cursor-pointer">Your events</Link>
                                                            <Link href="#" className="text-sm text-blue-600 hover:underline cursor-pointer">Your recordings</Link>
                                                        </div>
                                                    </div>

                                                    {/* Other Items */}
                                                    {["Interactive quests", "Courses", "Certifications", "Books"].map((learningItem) => (
                                                        <Link
                                                            key={learningItem}
                                                            href="#"
                                                            className="block px-4 py-3 text-base font-bold text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                                                        >
                                                            {learningItem}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : item === "Featured" ? (
                                        // Featured with Dropdown (Click to open)
                                        <div
                                            onMouseEnter={() => setHoveredNav(item)}
                                            onMouseLeave={() => setHoveredNav(null)}
                                        >
                                            <button
                                                onClick={() => {
                                                    setIsFeaturedOpen(!isFeaturedOpen);
                                                    setIsExploreOpen(false);
                                                    setIsStartLearningOpen(false);
                                                }}
                                                className="text-base font-bold px-3 py-1.5 rounded transition-all duration-200 ease-in-out flex items-center gap-1 cursor-pointer"
                                                style={{
                                                    color: (hoveredNav === item || isFeaturedOpen) ? TECH_BLUE : "#374151",
                                                    backgroundColor: "white",
                                                    border: (hoveredNav === item || isFeaturedOpen) ? "1px solid #0062ffff" : "1px solid transparent",
                                                }}
                                            >
                                                {item}
                                            </button>

                                            {/* Dropdown Menu */}
                                            {isFeaturedOpen && (
                                                <div
                                                    className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[220px] z-50"
                                                    style={{
                                                        animation: "fadeIn 0.15s ease-out",
                                                    }}
                                                >
                                                    {["Expert playlists", "Early releases", "Superstreams", "Platform news"].map((featuredItem) => (
                                                        <Link
                                                            key={featuredItem}
                                                            href="#"
                                                            className="block px-4 py-3 text-base font-bold text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                                                        >
                                                            {featuredItem}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Regular Nav Items (Answers)
                                        <Link
                                            href="#"
                                            className="text-base font-bold px-3 py-1.5 rounded transition-all duration-200 ease-in-out flex items-center gap-1"
                                            style={{
                                                color: item === "Answers" ? "#330986ff" : (hoveredNav === item ? TECH_BLUE : "#374151"),
                                                backgroundColor: "white",
                                                border: hoveredNav === item ? "1px solid #0062ffff" : "1px solid transparent",
                                            }}
                                            onMouseEnter={() => setHoveredNav(item)}
                                            onMouseLeave={() => setHoveredNav(null)}
                                        >
                                            {item === "Answers" && <Sparkles className="w-6 h-6" style={{ color: "#330986ff" }} />}
                                            {item}
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>

                    {/* RIGHT SIDE: Search + Subscribe + Profile */}
                    <div className="flex items-center gap-4">
                        {/* Search Bar - With focus animation */}
                        <div
                            className="hidden sm:flex items-center gap-3 bg-white rounded mr-80 px-3 py-2 transition-all duration-300 ease-out"
                            style={{
                                border: isSearchFocused ? "1px solid #0F62FE" : "1px solid #9CA3AF",
                                boxShadow: isSearchFocused ? "0 0 0 3px rgba(15, 98, 254, 0.15)" : "none",
                                minWidth: isSearchFocused ? "380px" : "340px",
                            }}
                        >
                            <Search
                                className="w-4 h-4 flex-shrink-0 transition-colors duration-200"
                                style={{ color: isSearchFocused ? "#0F62FE" : "#000000" }}
                            />
                            <input
                                type="text"
                                placeholder="Search for books, courses, events, and more"
                                className="bg-transparent text-sm text-gray-900 placeholder-gray-300 outline-none w-full"
                                onFocus={() => {
                                    setIsSearchFocused(true);
                                    setIsExploreOpen(false);
                                    setIsStartLearningOpen(false);
                                    setIsFeaturedOpen(false);
                                }}
                                onBlur={() => setIsSearchFocused(false)}
                            />
                        </div>

                        {/* Subscribe CTA - With hover animation */}
                        <button
                            className="hidden lg:flex items-center justify-center text-base font-bold px-10 py-1.5 rounded transition-all duration-200 ease-in-out whitespace-nowrap mr-0"
                            style={{
                                backgroundColor: isSubscribeHovered ? "var(--oreilly-red-hover)" : "var(--oreilly-red)",
                                color: "white",
                                transform: isSubscribeHovered ? "scale(1.02)" : "scale(1)",
                            }}
                            onMouseEnter={() => setIsSubscribeHovered(true)}
                            onMouseLeave={() => setIsSubscribeHovered(false)}
                        >
                            Subscribe now
                        </button>

                        {/* User Profile */}
                        <button className="p-6 hover:bg-gray-900 rounded-full transition-colors">
                            <User className="w-7 h-7 text-gray-900" />
                        </button>

                        {/* Mobile Menu */}
                        <button className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <Menu className="w-5 h-5 text-gray-900" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
