"use client";

import React from "react";

export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      {/* 1. Translucent Fluid Base Pool (Atmospheric optical depth foundation) */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-black/[0.03] dark:from-white/[0.03] dark:via-transparent dark:to-black/50" />

      {/* 2. Fluid Current 1: Crystalline Azure Flow (Top-Left to Mid-Center) */}
      <div className="absolute -top-[20%] -left-[10%] w-[88vw] h-[78vw] max-w-[900px] max-h-[820px] rounded-[45%_55%_65%_35%/50%_60%_40%_50%] blur-[55px] sm:blur-[75px] opacity-80 dark:opacity-50 animate-water-wave-1 transition-all duration-1000 water-current-1" />

      {/* 3. Fluid Current 2: Warm Pearlescent Alabaster Flow (Bottom-Right counter-current) */}
      <div className="absolute -bottom-[15%] -right-[10%] w-[82vw] h-[82vw] max-w-[850px] max-h-[850px] rounded-[55%_45%_40%_60%/45%_55%_50%_50%] blur-[65px] sm:blur-[85px] opacity-70 dark:opacity-45 animate-water-wave-2 transition-all duration-1000 water-current-2" />

      {/* 4. Optical Prism Dispersion Ribbon (Ethereal, restrained chromatic refraction) */}
      <div className="absolute top-[22%] left-[8%] w-[85vw] h-[52vw] max-w-[900px] max-h-[560px] rounded-[50%_50%_40%_60%/40%_60%_50%_50%] blur-[50px] sm:blur-[65px] opacity-55 dark:opacity-30 animate-water-diffract transition-all duration-1000 water-diffraction" />

      {/* 5. Overhead Surface Caustic Refraction (Simulates soft light playing across liquid) */}
      <div className="absolute top-0 left-[15%] right-[15%] h-[38vh] max-h-[400px] rounded-full blur-[42px] sm:blur-[58px] opacity-65 dark:opacity-35 animate-water-caustic transition-all duration-1000 water-caustic" />

      {/* 6. Central Optical Distortion Veil (Creates spherical depth behind main interface cards) */}
      <div className="absolute top-[30%] left-[20%] right-[20%] h-[45vh] rounded-full blur-[60px] sm:blur-[80px] opacity-60 dark:opacity-40 water-optical-distortion pointer-events-none" />

      {/* 7. Ambient Liquid Drift Ribbon 3 (Mid-depth fluid current) */}
      <div className="absolute top-[48%] -left-[8%] w-[52vw] h-[42vw] max-w-[540px] max-h-[440px] rounded-full blur-[60px] sm:blur-[80px] opacity-45 dark:opacity-25 animate-water-wave-3 transition-all duration-1000 water-current-3" />
    </div>
  );
}
