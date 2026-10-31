"use client";

import React, { useRef } from "react";

interface DayWheelPickerProps {
  value: number; // 1 to 31
  onChange: (day: number) => void;
}

export function DayWheelPicker({
  value,
  onChange,
}: DayWheelPickerProps) {
  const touchStartY = useRef<number | null>(null);

  // Helper for ordinal suffix: 1st, 2nd, 3rd, 4th...
  const getSuffix = (n: number) => {
    if (n >= 11 && n <= 13) return "th";
    switch (n % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  // Wrap day in 1..31 range
  const getPrevDay = (d: number) => (d === 1 ? 31 : d - 1);
  const getNextDay = (d: number) => (d === 31 ? 1 : d + 1);

  const prevDay = getPrevDay(value);
  const nextDay = getNextDay(value);

  // Vertical wheel scrolling
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      onChange(getNextDay(value));
    } else if (e.deltaY < 0) {
      onChange(getPrevDay(value));
    }
  };

  // Vertical touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = touchStartY.current - e.touches[0].clientY;
    if (Math.abs(diff) > 18) {
      if (diff > 0) {
        onChange(getNextDay(value));
      } else {
        onChange(getPrevDay(value));
      }
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
  };

  return (
    <div
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label={`Salary Day Picker: current ${value}${getSuffix(value)}`}
      className="flex flex-col items-center justify-between select-none w-16 sm:w-20 h-18 sm:h-20 bg-transparent border-0 border-none shadow-none"
    >
      {/* Top: Previous Day (Dimmed & Small, Border-free, BG-free) */}
      <button
        type="button"
        onClick={() => onChange(prevDay)}
        aria-label={`Previous day: ${prevDay}`}
        className="w-full flex items-center justify-center font-mono text-xs text-text-muted opacity-35 hover:opacity-75 scale-90 active:scale-75 transition-all duration-150 cursor-pointer select-none bg-transparent border-0 border-none"
      >
        <span>
          {prevDay}
          {getSuffix(prevDay)}
        </span>
      </button>

      {/* Middle: Selected Day (Bold Typography, Border-free, BG-free, No Circular) */}
      <div className="w-full flex items-center justify-center font-mono font-bold text-sm sm:text-base text-text-primary select-none bg-transparent border-0 border-none py-1">
        <span>
          {value}
          {getSuffix(value)}
        </span>
      </div>

      {/* Bottom: Next Day (Dimmed & Small, Border-free, BG-free) */}
      <button
        type="button"
        onClick={() => onChange(getNextDay(value))}
        aria-label={`Next day: ${nextDay}`}
        className="w-full flex items-center justify-center font-mono text-xs text-text-muted opacity-35 hover:opacity-75 scale-90 active:scale-75 transition-all duration-150 cursor-pointer select-none bg-transparent border-0 border-none"
      >
        <span>
          {nextDay}
          {getSuffix(nextDay)}
        </span>
      </button>
    </div>
  );
}
