"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTheme } from "@/context/ThemeContext";

export function Navbar() {
  const { theme } = useTheme();

  return (
    <header className="sticky top-2 sm:top-4 z-50 w-full flex justify-center pointer-events-none px-1">
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto w-[97%] md:w-[95%] lg:w-[85%] xl:w-[85%] 2xl:w-[85%] mx-auto h-14 sm:h-16 squircle rounded-2xl bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] shadow-lg shadow-black/5 dark:shadow-black/60 flex items-center justify-between px-3.5 sm:px-5 transition-all duration-200"
      >
        {/* Left: Authentic Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none select-none active:scale-95 transition-transform duration-150"
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 squircle rounded-xl overflow-hidden flex-shrink-0 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/15">
            <Image
              src={theme === "light" ? "/icons/icon-light.png" : "/icons/icon-dark.png"}
              alt="Expense Tracker Logo"
              width={36}
              height={36}
              priority
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm sm:text-base tracking-tight text-black dark:text-white leading-tight group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors duration-150">
              Expense Tracker
            </span>
            <span className="hidden sm:block text-[10px] font-medium tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
              Liquid Glass Edition
            </span>
          </div>
        </Link>

        {/* Right: Only User Avatar and Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <ThemeToggle />
          <UserAvatar initials="KR" name="Krutarth Raval" />
        </div>
      </nav>
    </header>
  );
}
