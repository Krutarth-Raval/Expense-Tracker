"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";

export function Navbar() {
  const { theme } = useTheme();

  return (
    <header className="sticky top-2 sm:top-4 z-40 w-full flex justify-center pointer-events-none px-2 sm:px-4">
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto w-[96%] md:w-[94%] lg:w-[85%] max-w-5xl mx-auto squircle-nav rounded-full liquid-glass-nav flex items-center justify-between transition-all duration-200"
        style={{ padding: "var(--navbar-pad)" }}
      >
        {/* Left: Logo Only */}
        <Link
          href="/"
          aria-label="Home"
          className="flex items-center active:scale-95 transition-transform duration-150 select-none focus:outline-none flex-shrink-0 ml-2 sm:ml-2.5"
        >
          <div
            className="relative squircle-icon-sm overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{
              width: "var(--navbar-logo-size)",
              height: "var(--navbar-logo-size)",
            }}
          >
            <Image
              src={theme === "light" ? "/icons/icon-light.png" : "/icons/icon-dark.png"}
              alt="Logo"
              width={40}
              height={40}
              priority
              className="w-full h-full object-cover"
            />
          </div>
        </Link>

        {/* Right: Theme Toggle Only (Centered with equal four-sided spacing) */}
        <div className="flex items-center flex-shrink-0">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
