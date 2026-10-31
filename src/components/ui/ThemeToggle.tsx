"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div 
        className="w-10 h-10 squircle rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 opacity-50"
        aria-hidden="true"
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="relative w-10 h-10 squircle rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 active:scale-95 border border-black/10 dark:border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] backdrop-blur-md flex items-center justify-center cursor-pointer transition-all duration-150"
    >
      <span className="sr-only">Toggle theme</span>
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun
          className={`w-4.5 h-4.5 text-neutral-800 dark:text-neutral-200 absolute transition-all duration-200 ease-out ${
            isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
          }`}
          strokeWidth={1.8}
        />
        {/* Moon Icon */}
        <Moon
          className={`w-4.5 h-4.5 text-neutral-200 absolute transition-all duration-200 ease-out ${
            isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
          }`}
          strokeWidth={1.8}
        />
      </div>
    </button>
  );
}
