"use client";

import React from "react";

export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      {/* Ambient Lighting Orbs - Strict Monochrome Palette (Black, White, Neutral Greys) */}
      
      {/* Orb 1: Upper Left to Center Slow Drift */}
      <div
        className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full blur-[100px] sm:blur-[130px] opacity-25 dark:opacity-20 animate-ambient-drift-1 transition-opacity duration-1000"
        style={{
          backgroundColor: "var(--ambient-orb-1, rgba(200, 200, 200, 0.25))",
        }}
      />

      {/* Orb 2: Lower Right to Center Counter-Drift */}
      <div
        className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full blur-[110px] sm:blur-[140px] opacity-20 dark:opacity-15 animate-ambient-drift-2 transition-opacity duration-1000"
        style={{
          backgroundColor: "var(--ambient-orb-2, rgba(160, 160, 160, 0.2))",
        }}
      />

      {/* Orb 3: Central Subtle Breathing Highlight */}
      <div
        className="absolute top-[30%] left-[25%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] rounded-full blur-[90px] sm:blur-[120px] opacity-15 dark:opacity-10 animate-ambient-pulse transition-opacity duration-1000"
        style={{
          backgroundColor: "var(--ambient-orb-3, rgba(255, 255, 255, 0.15))",
        }}
      />
    </div>
  );
}

