"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { triggerHaptic } from "@/lib/haptics";

export interface DayData {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sun, 6 = Sat
  monthIndex: number;
  isCurrentYear: boolean;
  isToday: boolean;
}

export interface WeekColumn {
  weekIndex: number;
  days: DayData[];
  monthLabel?: string;
}

interface ExpensesCalendarProps {
  dailyExpenses?: Record<string, number>;
}

export function ExpensesCalendar({ dailyExpenses = {} }: ExpensesCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(
    () =>
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
        today.getDate()
      ).padStart(2, "0")}`,
    [today]
  );

  // Selected date defaults to today
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentWeekRef = useRef<HTMLDivElement>(null);

  // Generate 53 weeks for the full year 2026
  const weeks = useMemo(() => {
    const year = 2026;
    const result: WeekColumn[] = [];

    const jan1 = new Date(year, 0, 1);
    const startDay = jan1.getDay(); // Sunday = 0
    const cur = new Date(year, 0, 1 - startDay);
    const endDate = new Date(year, 11, 31);

    let weekIndex = 0;
    let lastLabeledMonth = -1;

    while (cur <= endDate || cur.getDay() !== 0) {
      const weekDays: DayData[] = [];
      let weekMonthForLabel: string | undefined = undefined;

      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const isCurYear = cur.getFullYear() === year;
        const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(
          cur.getDate()
        ).padStart(2, "0")}`;
        const isToday = dateStr === todayStr;
        const monthIndex = cur.getMonth();

        // Check if this day starts a new month and we haven't labeled it yet
        if (isCurYear && monthIndex !== lastLabeledMonth && cur.getDate() <= 7) {
          lastLabeledMonth = monthIndex;
          weekMonthForLabel = cur.toLocaleString("en-US", { month: "short" });
        }

        weekDays.push({
          date: new Date(cur),
          dateStr,
          dayOfWeek,
          monthIndex,
          isCurrentYear: isCurYear,
          isToday,
        });

        cur.setDate(cur.getDate() + 1);
      }

      result.push({
        weekIndex,
        days: weekDays,
        monthLabel: weekMonthForLabel,
      });
      weekIndex++;

      if (cur.getFullYear() > year && cur.getDay() === 0) {
        break;
      }
    }

    return result;
  }, [todayStr]);

  // Auto-scroll to current week on mount
  useEffect(() => {
    if (currentWeekRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const target = currentWeekRef.current;
      const targetLeft = target.offsetLeft;
      container.scrollTo({
        left: Math.max(0, targetLeft - container.clientWidth / 2 + 40),
        behavior: "smooth",
      });
    }
  }, [weeks]);

  // Format currency
  const formatRupee = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(val)) return "₹0";
    return `₹${val.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format display date: "1 Nov 2026"
  const formatDisplayDate = (dateStr: string): string => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayNum = dateObj.getDate();
    const monthName = dateObj.toLocaleString("en-US", { month: "short" });
    const yearNum = dateObj.getFullYear();
    return `${dayNum} ${monthName} ${yearNum}`;
  };

  const selectedAmount = dailyExpenses[selectedDate] || 0;

  return (
    <div className="w-full squircle-card liquid-glass liquid-glass-rim border border-border p-4 sm:p-5 shadow-xl flex flex-col gap-3.5 sm:gap-4">
      {/* 1. Section Title */}
      <div className="flex items-center justify-between">
        <span className="text-sm sm:text-base font-semibold text-text-primary">
          Expenses Calendar
        </span>
      </div>

      {/* 2. Horizontally Scrollable Heatmap Grid (GitHub Commit Blocks) */}
      <div
        ref={scrollContainerRef}
        className="w-full overflow-x-auto pb-1 scrollbar-none select-none"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          touchAction: "pan-x pan-y",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "auto",
        }}
      >
        <div className="inline-flex flex-col gap-1 min-w-max">
          {/* Month labels row */}
          <div className="flex gap-1.5 h-4 mb-0.5">
            {weeks.map((week) => (
              <div
                key={`label-${week.weekIndex}`}
                className="w-3.5 sm:w-4 flex-shrink-0 text-[10px] font-mono text-text-muted select-none"
              >
                {week.monthLabel ? week.monthLabel : ""}
              </div>
            ))}
          </div>

          {/* 7-Row Heatmap Block Grid */}
          <div className="flex gap-1.5">
            {weeks.map((week) => {
              const containsToday = week.days.some((d) => d.isToday);

              return (
                <div
                  key={`week-${week.weekIndex}`}
                  ref={containsToday ? currentWeekRef : undefined}
                  className="flex flex-col gap-1.5 flex-shrink-0"
                >
                  {week.days.map((day) => {
                    const isSelected = selectedDate === day.dateStr;
                    const amount = dailyExpenses[day.dateStr] || 0;

                    // 5-level intensity gradient using globals.css color palette tokens
                    let level = 0;
                    if (amount > 0) {
                      if (amount < 500) level = 1;
                      else if (amount < 1500) level = 2;
                      else if (amount < 3000) level = 3;
                      else level = 4;
                    }

                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() => {
                          triggerHaptic("light");
                          setSelectedDate(day.dateStr);
                        }}
                        aria-label={`${day.dateStr}: ${formatRupee(amount)}`}
                        style={{ touchAction: "manipulation" }}
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] sm:rounded-[4px] cursor-pointer transition-all duration-150 relative ${
                          !day.isCurrentYear
                            ? "opacity-0 pointer-events-none"
                            : isSelected
                            ? "ring-2 ring-text-primary ring-offset-2 ring-offset-background scale-110 z-10"
                            : day.isToday
                            ? "ring-1 ring-text-primary/70 scale-105"
                            : ""
                        } ${
                          level === 0
                            ? "bg-calendar-0 hover:opacity-80"
                            : level === 1
                            ? "bg-calendar-1 hover:opacity-85"
                            : level === 2
                            ? "bg-calendar-2 hover:opacity-90"
                            : level === 3
                            ? "bg-calendar-3 hover:opacity-95"
                            : "bg-calendar-4 shadow-sm"
                        }`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Date on Left, Money Spent on Right (Default shows current date) */}
      <div className="flex items-center justify-between pt-3 border-t border-divider mt-0.5">
        <span className="text-sm sm:text-base font-semibold text-text-primary">
          {formatDisplayDate(selectedDate)}
        </span>

        <span className="text-base sm:text-lg font-bold font-mono text-text-primary">
          {formatRupee(selectedAmount)}
        </span>
      </div>
    </div>
  );
}

