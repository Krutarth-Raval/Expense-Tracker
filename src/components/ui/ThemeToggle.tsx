"use client";

import React, { useSyncExternalStore, useRef, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import { useTheme } from "@/context/ThemeContext";
import { triggerHaptic } from "@/lib/haptics";

const subscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const isDark = theme === "dark";
  const indicatorControls = useAnimationControls();
  const isFirstRender = useRef(true);
  const prevDarkRef = useRef(isDark);

  useEffect(() => {
    if (!mounted) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      indicatorControls.set({
        x: isDark ? "calc(100% + var(--toggle-gap))" : "0%",
        scale: 1,
      });
      prevDarkRef.current = isDark;
      return;
    }

    if (prevDarkRef.current === isDark) {
      return;
    }
    prevDarkRef.current = isDark;

    if (shouldReduceMotion) {
      indicatorControls.set({
        x: isDark ? "calc(100% + var(--toggle-gap))" : "0%",
        scale: 1,
      });
      return;
    }

    // Zoom In (1.0 -> 1.12), Travel, Settle (1.12 -> 1.0)
    indicatorControls.start({
      x: isDark ? "calc(100% + var(--toggle-gap))" : "0%",
      scale: [1, 1.12, 1],
      transition: {
        x: {
          type: "spring",
          stiffness: 320,
          damping: 26,
          mass: 0.85,
        },
        scale: {
          duration: 0.45,
          times: [0, 0.38, 1],
          ease: [0.16, 1, 0.3, 1],
        },
      },
    });
  }, [isDark, mounted, indicatorControls, shouldReduceMotion]);

  if (!mounted) {
    return (
      <div
        className="rounded-full liquid-glass-nav opacity-50 flex-shrink-0"
        style={{
          width: "calc(var(--toggle-btn-width) * 2 + var(--toggle-gap) + var(--toggle-pad) * 2)",
          height: "calc(var(--toggle-btn-height) + var(--toggle-pad) * 2)",
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme selection"
      className="relative flex items-center rounded-full squircle-nav liquid-glass-nav shadow-lg select-none flex-shrink-0"
      style={{
        padding: "var(--toggle-pad)",
        gap: "var(--toggle-gap)",
      }}
    >
      {/* Single Shared Animated Glass Indicator: Zoom, Travel & Settle */}
      <motion.div
        className="absolute rounded-full liquid-glass-active-pill shadow-md pointer-events-none"
        style={{
          top: "var(--toggle-pad)",
          bottom: "var(--toggle-pad)",
          left: "var(--toggle-pad)",
          width: "var(--toggle-btn-width)",
          height: "var(--toggle-btn-height)",
        }}
        animate={indicatorControls}
      />

      {/* Light Mode Button */}
      <button
        type="button"
        role="radio"
        aria-checked={!isDark}
        aria-label="Switch to light theme"
        onClick={() => {
          triggerHaptic("light");
          setTheme("light");
        }}
        className="relative z-10 rounded-full squircle-btn flex items-center justify-center cursor-pointer focus:outline-none"
        style={{
          width: "var(--toggle-btn-width)",
          height: "var(--toggle-btn-height)",
        }}
      >
        <Sun
          className={`relative z-20 w-4.5 h-4.5 sm:w-5 sm:h-5 transition-colors duration-200 ${
            !isDark
              ? "text-text-primary"
              : "text-text-muted hover:text-text-secondary"
          }`}
          strokeWidth={1.9}
        />
      </button>

      {/* Dark Mode Button */}
      <button
        type="button"
        role="radio"
        aria-checked={isDark}
        aria-label="Switch to dark theme"
        onClick={() => {
          triggerHaptic("light");
          setTheme("dark");
        }}
        className="relative z-10 rounded-full squircle-btn flex items-center justify-center cursor-pointer focus:outline-none"
        style={{
          width: "var(--toggle-btn-width)",
          height: "var(--toggle-btn-height)",
        }}
      >
        <Moon
          className={`relative z-20 w-4.5 h-4.5 sm:w-5 sm:h-5 transition-colors duration-200 ${
            isDark
              ? "text-text-primary"
              : "text-text-muted hover:text-text-secondary"
          }`}
          strokeWidth={1.9}
        />
      </button>
    </div>
  );
}
