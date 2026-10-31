"use client";

import React, { useState } from "react";
import { CalendarDays, IndianRupee, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface SalarySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SalarySetupModal({
  isOpen,
  onClose,
  onSuccess,
}: SalarySetupModalProps) {
  const { user, updateUserProfile } = useAuth();
  const [salaryDay, setSalaryDay] = useState<number>(() => {
    return user?.salaryDay || 7;
  });
  const [salaryAmount, setSalaryAmount] = useState<string>(() => {
    return user?.salaryAmount ? String(user.salaryAmount) : "25000";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    const numAmount = parseFloat(salaryAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid salary amount");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          salaryDay,
          salaryAmount: numAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to save salary settings");
        setIsSubmitting(false);
        return;
      }

      updateUserProfile({
        salaryDay,
        salaryAmount: numAmount,
      });

      setIsSubmitting(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Salary setup error:", err);
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/30 dark:bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md squircle-card liquid-glass liquid-glass-rim border border-border px-4 py-5 sm:px-6 sm:py-6 shadow-2xl flex flex-col gap-4">
        {/* Header with Close X */}
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-text-primary">
            Set Up Monthly Salary
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full squircle-btn liquid-glass border border-border flex items-center justify-center text-text-primary hover:bg-surface-elevated active:scale-95 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3.5">
          {/* Salary Date Picker (Day 1 to 31) */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="salary-day-select"
              className="text-xs sm:text-sm font-semibold text-text-secondary flex items-center gap-1.5"
            >
              <CalendarDays size={15} />
              <span>Salary Date (Day of Month)</span>
            </label>
            <select
              id="salary-day-select"
              value={salaryDay}
              onChange={(e) => setSalaryDay(parseInt(e.target.value, 10))}
              className="w-full h-11 px-3.5 rounded-full squircle-input liquid-glass border border-border text-sm sm:text-base font-semibold text-text-primary focus:outline-none focus:border-text-primary transition-all cursor-pointer bg-background"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day} className="bg-background text-text-primary">
                  {day}
                  {day === 1 || day === 21 || day === 31
                    ? "st"
                    : day === 2 || day === 22
                    ? "nd"
                    : day === 3 || day === 23
                    ? "rd"
                    : "th"}{" "}
                  of every month
                </option>
              ))}
            </select>
          </div>

          {/* Salary Amount Input */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="salary-amount-input"
              className="text-xs sm:text-sm font-semibold text-text-secondary flex items-center gap-1.5"
            >
              <IndianRupee size={15} />
              <span>Monthly Salary Amount</span>
            </label>
            <div className="relative w-full">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base sm:text-lg font-bold font-mono text-text-muted pointer-events-none">
                ₹
              </span>
              <input
                id="salary-amount-input"
                type="number"
                step="any"
                min="1"
                placeholder="25000"
                value={salaryAmount}
                onChange={(e) => {
                  setSalaryAmount(e.target.value);
                  setError(null);
                }}
                className="w-full h-11 pl-8 pr-3 rounded-full squircle-input liquid-glass border border-border text-lg sm:text-xl font-bold font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs font-mono text-rose-500 px-1">{error}</div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 rounded-full squircle-btn liquid-glass border border-border text-xs sm:text-sm font-medium text-text-muted hover:text-text-primary active:scale-95 transition-all cursor-pointer select-none"
            >
              Later
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 sm:h-12 rounded-full squircle-btn bg-text-primary text-background font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 disabled:opacity-50 transition-all cursor-pointer shadow-lg"
            >
              {isSubmitting ? (
                <span className="font-mono text-xs">Saving...</span>
              ) : (
                <span>Save Salary Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

