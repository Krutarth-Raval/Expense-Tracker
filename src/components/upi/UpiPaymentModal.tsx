"use client";

import React, { useState } from "react";
import { X, ExternalLink, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ScannedMerchant } from "./UpiScannerModal";
import { DEFAULT_PAYMENT_APPS } from "../profile/PaymentAppIcons";

interface UpiPaymentModalProps {
  isOpen: boolean;
  merchant: ScannedMerchant | null;
  onClose: () => void;
  onPaymentSuccess: (transaction: {
    id: string;
    amount: number;
    merchantName: string;
    merchantUpi: string;
    email: string;
    date: string | Date;
  }) => void;
}

export function UpiPaymentModal({
  isOpen,
  merchant,
  onClose,
  onPaymentSuccess,
}: UpiPaymentModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [pendingTx, setPendingTx] = useState<{
    id: string;
    amount: number;
    merchantName: string;
    merchantUpi: string;
    email: string;
    date: string | Date;
  } | null>(null);

  if (!isOpen || !merchant) return null;

  const defaultApp = user?.defaultPaymentApp || null;

  // Generate deep link intent for specific UPI apps
  const getUpiUrlForApp = (appIdOrName: string, numAmount: number) => {
    const encodedName = encodeURIComponent(merchant.merchantName);
    const standardQuery = `pa=${merchant.merchantUpi}&pn=${encodedName}&am=${numAmount}&cu=INR&tn=Payment via ExpenseTracker`;

    const lower = appIdOrName.toLowerCase();
    if (lower.includes("google") || lower.includes("gpay")) {
      return `tez://upi/pay?${standardQuery}`;
    }
    if (lower.includes("phonepe")) {
      return `phonepe://pay?${standardQuery}`;
    }
    if (lower.includes("paytm")) {
      return `paytmmp://pay?${standardQuery}`;
    }
    if (lower.includes("samsung")) {
      return `samsungpay://pay?${standardQuery}`;
    }
    return `upi://pay?${standardQuery}`;
  };

  const handlePay = async (selectedAppOverride?: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Punch the transaction into database
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          merchantName: merchant.merchantName,
          merchantUpi: merchant.merchantUpi,
          email: user?.email || "",
          date: new Date().toISOString(), // Keep date in database, not displayed in this modal
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to record payment");
        setIsSubmitting(false);
        return;
      }

      const createdTx = data.transaction;
      setPendingTx(createdTx);

      // 2. Launch UPI application
      const targetApp = selectedAppOverride || defaultApp;
      if (targetApp) {
        const upiUrl = getUpiUrlForApp(targetApp, numAmount);
        window.location.assign(upiUrl);
        setTimeout(() => {
          onPaymentSuccess(createdTx);
          onClose();
        }, 800);
      } else {
        // Show choice of UPI applications if none configured
        setShowAppPicker(true);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAppAndLaunch = (appName: string) => {
    if (!pendingTx) return;
    const upiUrl = getUpiUrlForApp(appName, pendingTx.amount);
    window.location.assign(upiUrl);
    setTimeout(() => {
      onPaymentSuccess(pendingTx);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 bg-black/20 dark:bg-black/35 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md squircle-card liquid-glass liquid-glass-rim border border-border px-3.5 py-4 sm:px-4 sm:py-5 shadow-2xl flex flex-col gap-3.5">
        {/* Header (Clean, minimal padding, no bottom divider) */}
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-base sm:text-lg font-semibold text-text-primary">
            Pay Merchant
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

        {/* Auto-fetched Real Merchant Details from QR (Minimal side padding) */}
        <div className="px-3 py-2.5 rounded-2xl squircle-card liquid-glass border border-border flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-text-muted">Paying to</span>
          <div className="text-base sm:text-lg font-bold text-text-primary truncate">
            {merchant.merchantName}
          </div>
          <div className="text-xs font-mono text-text-muted break-all">
            UPI ID: {merchant.merchantUpi}
          </div>
        </div>

        {/* Amount Input (Minimal side padding) */}
        <div className="flex flex-col gap-1 px-0.5">
          <label
            htmlFor="upi-payment-amount"
            className="text-xs sm:text-sm font-semibold text-text-secondary"
          >
            Enter Amount
          </label>
          <div className="relative w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg sm:text-xl font-bold font-mono text-text-muted pointer-events-none">
              ₹
            </span>
            <input
              id="upi-payment-amount"
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
                  handlePay();
                }
              }}
              autoFocus
              className="w-full h-13 pl-9 pr-3 rounded-full squircle-input liquid-glass border border-border text-2xl sm:text-3xl font-bold font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="text-xs font-mono text-rose-500 px-0.5">{error}</div>
        )}

        {/* If App Picker needed because user has no default app selected */}
        {showAppPicker && pendingTx ? (
          <div className="flex flex-col gap-2 pt-1 animate-in fade-in duration-150">
            <span className="text-xs font-semibold text-text-secondary px-0.5">
              Select UPI App to Complete Payment
            </span>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_PAYMENT_APPS.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => handleSelectAppAndLaunch(app.name)}
                  className="h-11 px-3 rounded-xl squircle-btn liquid-glass border border-border text-xs sm:text-sm font-medium text-text-primary hover:bg-surface-elevated active:scale-95 transition-all flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">{app.name}</span>
                  <ExternalLink size={14} className="text-text-muted" />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleSelectAppAndLaunch("Generic UPI")}
              className="h-10 px-3 rounded-full squircle-btn liquid-glass border border-border text-xs font-mono text-text-muted hover:text-text-primary active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer mt-1"
            >
              <span>Any Default UPI App</span>
            </button>
          </div>
        ) : (
          /* Main Pay Button */
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => handlePay()}
              disabled={isSubmitting || !amount.trim()}
              aria-label="Pay Now"
              className="w-full h-12 sm:h-13 rounded-full squircle-btn bg-text-primary text-background font-semibold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-xl hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    Pay {defaultApp ? `with ${defaultApp}` : "Now"}
                  </span>
                  <Check size={18} strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
