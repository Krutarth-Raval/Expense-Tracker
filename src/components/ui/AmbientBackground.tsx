"use client";

import React from "react";

export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      {/* 1. Base Liquid Water Foundation */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background-secondary to-background transition-colors duration-700" />

      {/* 2. Primary Upper Fluid Wave Swell */}
      <div
        className="absolute -top-[25%] -left-[15%] w-[85vw] h-[75vw] max-w-[900px] max-h-[800px] rounded-[48%_52%_60%_40%/50%_60%_40%_50%] blur-[90px] sm:blur-[120px] opacity-60 dark:opacity-40 animate-liquid-wave-1 transition-all duration-1000"
        style={{
          background: "var(--liquid-wave-1)",
        }}
      />

      {/* 3. Counter-Flow Lower Liquid Refraction Swell */}
      <div
        className="absolute -bottom-[25%] -right-[15%] w-[90vw] h-[80vw] max-w-[950px] max-h-[850px] rounded-[55%_45%_42%_58%/48%_54%_46%_52%] blur-[100px] sm:blur-[130px] opacity-55 dark:opacity-35 animate-liquid-wave-2 transition-all duration-1000"
        style={{
          background: "var(--liquid-wave-2)",
        }}
      />

      {/* 4. Central Liquid Caustic Refraction (Breathing water light sheet) */}
      <div
        className="absolute top-[20%] left-[10%] w-[80vw] h-[60vw] max-w-[800px] max-h-[600px] rounded-[42%_58%_50%_50%/55%_45%_55%_45%] blur-[80px] sm:blur-[110px] opacity-45 dark:opacity-25 animate-liquid-caustic transition-all duration-1000"
        style={{
          background: "var(--liquid-caustic)",
        }}
      />

      {/* 5. Pearlescent Diffraction & Rainbow Dispersion Ribbon */}
      <div
        className="absolute top-[12%] -left-[20%] w-[140vw] h-[55vw] max-w-[1400px] max-h-[600px] -rotate-12 rounded-[50%] blur-[95px] sm:blur-[125px] opacity-50 dark:opacity-20 animate-pearlescent-drift mix-blend-soft-light transition-all duration-1000"
        style={{
          background: "var(--liquid-pearlescent)",
        }}
      />

      {/* 6. Subtle Micro Caustic Light Ripples (Water Surface Refraction) */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.025] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.8) 0%, transparent 40%), radial-gradient(ellipse at 70% 80%, rgba(255,255,255,0.6) 0%, transparent 45%)`,
          filter: "blur(40px)",
        }}
      />
    </div>
  );
}
