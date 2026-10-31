"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function OtpVerification({
  onBack,
}: {
  onBack?: () => void;
}) {
  const { verifyOtp, pendingEmail, setAuthScreen } = useAuth();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only accept numeric digits
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      setDigits(nextDigits);
      setError(null);
      return;
    }

    // Handle single digit input
    const char = cleaned.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = char;
    setDigits(nextDigits);
    setError(null);

    // Auto-advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const nextDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      nextDigits[i] = pasted[i];
    }
    setDigits(nextDigits);
    setError(null);

    const targetFocus = Math.min(pasted.length, 5);
    inputRefs.current[targetFocus]?.focus();
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length < 4) {
      setError("Enter the verification code");
      return;
    }

    setIsSubmitting(true);
    const result = await verifyOtp(code);
    setIsSubmitting(false);

    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  const handleBackToSignUp = () => {
    if (onBack) {
      onBack();
    } else {
      setAuthScreen("signup");
    }
  };

  const isComplete = digits.join("").length >= 4;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Bar with Back Action & Displayed Email */}
      <div className="w-full flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={handleBackToSignUp}
          aria-label="Back"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full squircle-btn liquid-glass border border-black/15 dark:border-white/20 flex items-center justify-center text-text-primary hover:bg-surface-elevated active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <ArrowLeftIcon size={17} />
        </button>

        {pendingEmail && (
          <span className="text-xs font-mono text-text-muted truncate max-w-[190px] sm:max-w-[220px] px-3 py-1 rounded-full liquid-glass border border-black/10 dark:border-white/10">
            {pendingEmail}
          </span>
        )}
      </div>

      {/* 6 Digit Input Cells (Fluid Responsive Width, No Overflow) */}
      <div className="flex items-center justify-between gap-1.5 xs:gap-2 sm:gap-2.5 w-full mb-5">
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${idx + 1}`}
            className="flex-1 min-w-0 max-w-[42px] sm:max-w-[46px] h-12 sm:h-13.5 text-center text-lg sm:text-xl font-mono font-medium rounded-xl sm:rounded-2xl squircle-tile liquid-glass border border-black/15 dark:border-white/20 text-text-primary focus:outline-none focus:border-black/50 dark:focus:border-white/60 focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 transition-all duration-150 selection:bg-transparent p-0"
          />
        ))}
      </div>

      {/* Minimal Error Indicator if validation fails */}
      {error && (
        <div className="text-xs sm:text-sm text-text-muted mb-4 font-mono tracking-wide">
          {error}
        </div>
      )}

      {/* Primary Action Button */}
      <button
        type="button"
        onClick={handleVerify}
        disabled={!isComplete || isSubmitting}
        aria-label="Verify Code"
        className={`w-full h-12 sm:h-13 rounded-full squircle-btn flex items-center justify-center font-semibold text-sm sm:text-base cursor-pointer select-none transition-all duration-200 active:scale-[0.98] ${
          isComplete && !isSubmitting
            ? "bg-text-primary text-background shadow-lg hover:opacity-90 cursor-pointer"
            : "bg-surface-elevated text-text-muted border border-black/10 dark:border-white/10 opacity-50 cursor-not-allowed"
        }`}
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
        ) : (
          "Verify"
        )}
      </button>
    </div>
  );
}
