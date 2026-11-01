"use client";

import React, { useState } from "react";
import { PiggyBank, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const { user, updateUserProfile } = useAuth();
  const [savings, setSavings] = useState("");
  const [monthBalance, setMonthBalance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    if (savings.trim() === "" || monthBalance.trim() === "") {
      setError("Both Current Savings and Salary Balance are compulsory to fill up");
      return;
    }

    const numSavings = parseFloat(savings);
    const numBalance = parseFloat(monthBalance);

    if (isNaN(numSavings) || isNaN(numBalance) || numSavings < 0 || numBalance < 0) {
      setError("Please enter valid amounts (0 or greater)");
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
          initialSavings: numSavings,
          initialMonthBalance: numBalance,
          onboardingCompleted: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to save initial balances");
        setIsSubmitting(false);
        return;
      }

      updateUserProfile({
        initialSavings: numSavings,
        initialMonthBalance: numBalance,
        onboardingCompleted: true,
      });

      setIsSubmitting(false);
      onComplete();
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/30 dark:bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md squircle-card liquid-glass liquid-glass-rim border border-border px-4 py-5 sm:px-6 sm:py-6 shadow-2xl flex flex-col gap-4">
        {/* Title */}
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-lg sm:text-xl font-bold text-text-primary">
            Welcome to Expense Tracker
          </h2>
          <p className="text-xs sm:text-sm text-text-muted">
            Enter your starting balances to set up your dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Question 1: Current Savings */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="onboarding-savings"
              className="text-xs sm:text-sm font-semibold text-text-secondary flex items-center gap-1.5"
            >
              <PiggyBank size={15} />
              <span>Current Savings</span>
            </label>
            <div className="relative w-full">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base sm:text-lg font-bold font-mono text-text-muted pointer-events-none">
                ₹
              </span>
              <input
                id="onboarding-savings"
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={savings}
                onChange={(e) => {
                  setSavings(e.target.value);
                  setError(null);
                }}
                autoFocus
                className="w-full h-11 pl-8 pr-3 rounded-full squircle-input liquid-glass border border-border text-lg sm:text-xl font-bold font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary transition-all"
              />
            </div>
            <span className="text-[11px] text-text-muted pl-1">
              Total savings you currently have in bank / cash
            </span>
          </div>

          {/* Question 2: Current Salary Balance */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="onboarding-month-balance"
              className="text-xs sm:text-sm font-semibold text-text-secondary flex items-center gap-1.5"
            >
              <Wallet size={15} />
              <span>Current Salary Balance</span>
            </label>
            <div className="relative w-full">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base sm:text-lg font-bold font-mono text-text-muted pointer-events-none">
                ₹
              </span>
              <input
                id="onboarding-month-balance"
                type="number"
                step="any"
                placeholder="0"
                value={monthBalance}
                onChange={(e) => {
                  setMonthBalance(e.target.value);
                  setError(null);
                }}
                className="w-full h-11 pl-8 pr-3 rounded-full squircle-input liquid-glass border border-border text-lg sm:text-xl font-bold font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary transition-all"
              />
            </div>
            <span className="text-[11px] text-text-muted pl-1">
              Money left to spend for this current month
            </span>
          </div>

          {error && (
            <div className="text-xs font-mono text-rose-500 px-1">{error}</div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 sm:h-12 w-full rounded-full squircle-btn bg-text-primary text-background font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 disabled:opacity-50 transition-all cursor-pointer shadow-lg mt-2"
          >
            {isSubmitting ? (
              <span className="font-mono text-sm">Saving...</span>
            ) : (
              <span>Continue to Dashboard</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

