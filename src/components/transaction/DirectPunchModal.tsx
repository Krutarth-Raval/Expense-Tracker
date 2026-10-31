"use client";

import React, { useState } from "react";
import { X, QrCode } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface DirectPunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transaction: {
    id: string;
    amount: number;
    merchantName: string;
    merchantUpi: string;
    email: string;
    date: string | Date;
  }) => void;
  onOpenScanner?: () => void;
}

export function DirectPunchModal({
  isOpen,
  onClose,
  onSuccess,
  onOpenScanner,
}: DirectPunchModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePunch = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const finalReason = reason.trim() || "Expense";

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          merchantName: finalReason,
          merchantUpi: "",
          email: user?.email || "",
          date: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to punch transaction");
        setIsSubmitting(false);
        return;
      }

      // Reset form
      setReason("");
      setAmount("");
      setIsSubmitting(false);

      // Notify parent to update dashboard & transactions
      onSuccess(data.transaction);
      onClose();
    } catch (err) {
      console.error("Direct punch error:", err);
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 bg-black/20 dark:bg-black/35 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md squircle-card liquid-glass liquid-glass-rim border border-border px-3.5 py-4 sm:px-4 sm:py-5 shadow-2xl flex flex-col gap-3.5">
        {/* Header */}
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-base sm:text-lg font-semibold text-text-primary">
            Punch Expense
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full squircle-btn liquid-glass border border-border flex items-center justify-center text-text-primary hover:bg-surface-elevated active:scale-95 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 1. Reason / Merchant Input */}
        <div className="flex flex-col gap-1 px-0.5">
          <label
            htmlFor="punch-reason"
            className="text-xs sm:text-sm font-semibold text-text-secondary"
          >
            Reason
          </label>
          <input
            id="punch-reason"
            type="text"
            placeholder="e.g. Coffee, Grocery, Rent"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handlePunch();
              }
            }}
            autoFocus
            className="w-full h-11 px-3.5 rounded-full squircle-input liquid-glass border border-border text-sm sm:text-base font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary transition-all"
          />
        </div>

        {/* 2. Amount Input */}
        <div className="flex flex-col gap-1 px-0.5">
          <label
            htmlFor="punch-amount"
            className="text-xs sm:text-sm font-semibold text-text-secondary"
          >
            Amount
          </label>
          <div className="relative w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg sm:text-xl font-bold font-mono text-text-muted pointer-events-none">
              ₹
            </span>
            <input
              id="punch-amount"
              type="number"
              step="any"
              min="1"
              placeholder="0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handlePunch();
                }
              }}
              className="w-full h-13 pl-9 pr-3 rounded-full squircle-input liquid-glass border border-border text-2xl sm:text-3xl font-bold font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="text-xs font-mono text-rose-500 px-0.5">{error}</div>
        )}

        {/* 3. Direct Punch Button */}
        <button
          type="button"
          onClick={handlePunch}
          disabled={isSubmitting}
          className="h-12 w-full rounded-full squircle-btn bg-text-primary text-background font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 disabled:opacity-50 transition-all cursor-pointer shadow-lg mt-1"
        >
          {isSubmitting ? (
            <span className="font-mono text-sm">Punching...</span>
          ) : (
            <span>Punch Transaction</span>
          )}
        </button>

        {/* Optional QR Scanner Shortcut */}
        {onOpenScanner && (
          <div className="flex justify-center pt-0.5">
            <button
              type="button"
              onClick={onOpenScanner}
              className="text-xs font-medium text-text-muted hover:text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer py-1"
            >
              <QrCode size={13} />
              <span>Or scan UPI QR code</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

