"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";
import { ExpensesCalendar } from "./ExpensesCalendar";
import { UpiScannerModal, ScannedMerchant } from "../upi/UpiScannerModal";
import { UpiPaymentModal } from "../upi/UpiPaymentModal";
import { DirectPunchModal } from "../transaction/DirectPunchModal";
import { SalarySetupModal } from "../onboarding/SalarySetupModal";

export interface TransactionItem {
  id: string;
  amount: number;
  merchantName: string;
  merchantUpi: string;
  email: string;
  date: string | Date;
}

export function HomeDashboard() {
  const { user, updateUserProfile } = useAuth();
  const userEmail = user?.email;
  const {
    isQrScannerOpen,
    closeQrScanner,
    openQrScanner,
    isDirectPunchOpen,
    closeDirectPunch,
  } = useNavigation();

  // Salary settings state
  const [salaryDay, setSalaryDay] = useState<number>(() => {
    if (user?.salaryDay) return user.salaryDay;
    if (user?.salaryDate) return new Date(user.salaryDate).getUTCDate();
    return 7;
  });

  const [salaryAmount, setSalaryAmount] = useState<number>(() => {
    if (typeof user?.salaryAmount === "number" && !isNaN(user.salaryAmount)) {
      return user.salaryAmount;
    }
    return 25000;
  });

  // Transactions state
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  // Payment flow modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [scannedMerchant, setScannedMerchant] = useState<ScannedMerchant | null>(null);

  // Salary setup modal state (pops up in a few seconds on Home)
  const [isSalarySetupOpen, setIsSalarySetupOpen] = useState(false);

  useEffect(() => {
    if (!userEmail) return;

    const sessionKey = `seen_salary_setup_${userEmail}`;
    const hasSeen = typeof window !== "undefined" ? sessionStorage.getItem(sessionKey) : "true";
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsSalarySetupOpen(true);
        sessionStorage.setItem(sessionKey, "true");
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [userEmail]);

  // Sync fresh profile from DB on mount
  useEffect(() => {
    if (!userEmail) return;

    fetch(`/api/user/profile?email=${encodeURIComponent(userEmail)}`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.user) {
          const freshUser = data.user;
          const freshDay = freshUser.salaryDay
            ? freshUser.salaryDay
            : freshUser.salaryDate
            ? new Date(freshUser.salaryDate).getUTCDate()
            : 7;
          setSalaryDay(freshDay);

          if (
            typeof freshUser.salaryAmount === "number" &&
            !isNaN(freshUser.salaryAmount)
          ) {
            setSalaryAmount(freshUser.salaryAmount);
          }
          updateUserProfile(freshUser);
        }
      })
      .catch((err) => {
        console.warn("Failed to sync user profile in Home:", err);
      });
  }, [userEmail, updateUserProfile]);

  // Fetch transactions from DB on mount
  useEffect(() => {
    if (!userEmail) return;

    let isSubscribed = true;

    fetch(`/api/transactions?email=${encodeURIComponent(userEmail)}`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (isSubscribed && data.success && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch transactions:", err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [userEmail]);

  // Current date formatted: e.g. "1 Nov 2026"
  const now = new Date();
  const currentDay = now.getDate();
  const currentActualMonth = now.getMonth(); // Actual calendar month (0 = Jan, 10 = Nov)
  const currentActualYear = now.getFullYear();
  const currentMonthShort = now.toLocaleString("en-US", { month: "short" });
  const currentYear = now.getFullYear();
  const currentDateFormatted = `${currentDay} ${currentMonthShort} ${currentYear}`;

  // Monthly salary from profile (default 25,000)
  const baseSalary = salaryAmount > 0 ? salaryAmount : 25000;

  // Initial balances entered during first-time signup onboarding
  const initialSavings =
    typeof user?.initialSavings === "number" && !isNaN(user.initialSavings)
      ? user.initialSavings
      : 0;

  const initialMonthBalance =
    typeof user?.initialMonthBalance === "number" && !isNaN(user.initialMonthBalance)
      ? user.initialMonthBalance
      : 200;

  // Month cycle runs salaryDay to (salaryDay - 1) as per user's salary date selection.
  // Before salary date arrives in current calendar month (currentDay < salaryDay):
  // User is still in previous/initial cycle with starting remaining money (initialMonthBalance).
  // Once salaryDay arrives, month balance updates with full monthly salary!
  const isSalaryDayArrived = currentDay >= salaryDay;
  const baseMonthBalance = isSalaryDayArrived ? baseSalary : initialMonthBalance;

  // Filter: Recent transactions strictly show the actual current calendar month
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const d = new Date(tx.date);
      return (
        d.getMonth() === currentActualMonth &&
        d.getFullYear() === currentActualYear
      );
    });
  }, [transactions, currentActualMonth, currentActualYear]);

  // Current month punched spent (sums only actual current calendar month transactions)
  const currentMonthSpent = useMemo(() => {
    return currentMonthTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [currentMonthTransactions]);

  // Money spent reflects current actual month spending (increases as transactions are made)
  const moneySpent = currentMonthSpent;

  // Month balance is base monthly salary/remaining money minus current actual month money spent
  // As user makes transactions, the remaining balance reduces
  const monthBalance = baseMonthBalance - currentMonthSpent;

  // Map daily transactions for the ExpensesCalendar heatmap
  const dailyExpensesMap = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      map[dateStr] = (map[dateStr] || 0) + tx.amount;
    });
    return map;
  }, [transactions]);

  // Total savings: Initial savings plus any leftover/over-use from completed past cycles
  // Sums (monthly salary - expenses) for all past completed calendar months
  const totalSavings = useMemo(() => {
    // If salary day has arrived in current month, the starting month balance leftover moves to savings!
    let savings = initialSavings + (isSalaryDayArrived && initialMonthBalance > 0 ? initialMonthBalance : 0);

    const monthlySpending: Record<string, number> = {};
    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlySpending[key] = (monthlySpending[key] || 0) + (tx.amount || 0);
    });

    const currentKey = `${currentActualYear}-${String(currentActualMonth + 1).padStart(2, "0")}`;

    // Past completed months with transactions (prior to active cycle)
    const pastMonthKeys = Object.keys(monthlySpending).filter((k) => k < currentKey && k !== "2026-10");

    pastMonthKeys.forEach((k) => {
      const spent = monthlySpending[k] || 0;
      const leftOver = baseSalary - spent;
      savings += leftOver;
    });

    return savings;
  }, [baseSalary, transactions, currentActualYear, currentActualMonth, isSalaryDayArrived, initialSavings, initialMonthBalance]);

  // Percentage of savings vs monthly salary
  const percentageVal = baseSalary > 0 ? (totalSavings / baseSalary) * 100 : 0;
  const formattedPercentage = Math.round(percentageVal);

  // Helper to format currency amount: "₹25,000" or "- ₹50"
  const formatRupee = (val: number): string => {
    const absVal = Math.abs(val).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    if (val < 0) return `- ₹${absVal}`;
    return `₹${absVal}`;
  };

  // Helper to format month balance: "+ ₹200" or "- ₹50"
  const formatMonthBalance = (val: number): string => {
    const absVal = Math.abs(val).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    if (val > 0) return `+ ₹${absVal}`;
    if (val < 0) return `- ₹${absVal}`;
    return `₹${absVal}`;
  };

  const formatSavingsRupee = (val: number): string => {
    const absVal = Math.abs(val).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    if (val > 0) return `+ ₹${absVal}`;
    if (val < 0) return `- ₹${absVal}`;
    return `₹${absVal}`;
  };

  const formatDisplayDate = (dInput: string | Date): string => {
    const d = new Date(dInput);
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Flow handlers
  const handleProceedToPay = (merchant: ScannedMerchant) => {
    setScannedMerchant(merchant);
    closeQrScanner();
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (newTx: TransactionItem) => {
    setTransactions((prev) => [newTx, ...prev]);
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="w-[96%] md:w-[94%] lg:w-[85%] max-w-5xl mx-auto flex flex-col gap-3.5 sm:gap-4 mt-3.5 sm:mt-5 animate-in fade-in zoom-in-95 duration-200">
      {/* Top Row: Total Savings (Same layout as other 2 tiles: title at top left, amount at bottom in bigger font) */}
      <div className="w-full squircle-card liquid-glass liquid-glass-rim border border-border p-4 sm:p-5 shadow-xl flex flex-col justify-between min-h-[100px] sm:min-h-[114px]">
        {/* Top Left: Title + Percentage side-by-side */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-text-secondary leading-tight text-left">
              Total Savings
            </span>

            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border bg-surface-elevated text-text-muted border-border"
            >
              {formattedPercentage}%
            </span>
          </div>
        </div>

        {/* Bottom Left: Large Money in bigger font */}
        <div className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono tracking-tight text-text-primary text-left truncate mt-3 sm:mt-4">
          {formatSavingsRupee(totalSavings)}
        </div>
      </div>

      {/* Date: Bright, bigger, and bold above both tiles */}
      <div className="px-1 text-sm sm:text-base font-bold text-text-primary select-none">
        {currentDateFormatted}
      </div>

      {/* Side-by-side tiles: Month Balance & Money Spent */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
        {/* Tile 1: Month Balance */}
        <div className="w-full squircle-card liquid-glass liquid-glass-rim border border-border p-4 sm:p-5 shadow-xl flex flex-col justify-between min-h-[100px] sm:min-h-[114px]">
          {/* Top Left: Title */}
          <span className="text-xs sm:text-sm font-semibold text-text-secondary leading-tight text-left">
            Month Balance
          </span>

          {/* Bottom Left: Large Money */}
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono tracking-tight text-text-primary text-left truncate mt-3 sm:mt-4">
            {formatMonthBalance(monthBalance)}
          </div>
        </div>

        {/* Tile 2: Money Spent */}
        <div className="w-full squircle-card liquid-glass liquid-glass-rim border border-border p-4 sm:p-5 shadow-xl flex flex-col justify-between min-h-[100px] sm:min-h-[114px]">
          {/* Top Left: Title */}
          <span className="text-xs sm:text-sm font-semibold text-text-secondary leading-tight text-left">
            Money Spent
          </span>

          {/* Bottom Left: Large Money */}
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono tracking-tight text-text-primary text-left truncate mt-3 sm:mt-4">
            {formatRupee(moneySpent)}
          </div>
        </div>
      </div>

      {/* Expenses Calendar Section: GitHub Commit Block Heatmap */}
      <ExpensesCalendar dailyExpenses={dailyExpensesMap} />

      {/* Transaction History Section (Recent transactions for the actual current calendar month) */}
      <div className="w-full squircle-card liquid-glass liquid-glass-rim border border-border p-4 sm:p-5 shadow-xl flex flex-col gap-3.5 sm:gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm sm:text-base font-semibold text-text-primary">
            Transaction History
          </span>
          <span className="text-xs font-mono text-text-muted">
            {currentMonthTransactions.length} {currentMonthTransactions.length === 1 ? "transaction" : "transactions"}
          </span>
        </div>

        {currentMonthTransactions.length === 0 ? (
          <div className="py-8 text-center text-xs sm:text-sm text-text-muted font-mono">
            No transactions in {currentMonthShort} {currentYear}. Click + to punch or scan QR to pay.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {currentMonthTransactions.map((tx) => (
              <div
                key={tx.id}
                className="w-full p-3.5 sm:p-4 rounded-2xl squircle-card liquid-glass border border-border flex flex-col gap-1.5"
              >
                {/* Top of the every transaction: Date */}
                <span className="text-[11px] sm:text-xs font-mono font-medium text-text-muted">
                  {formatDisplayDate(tx.date)}
                </span>

                {/* Main row: Merchant name & email on left, Amount on right */}
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm sm:text-base font-semibold text-text-primary truncate">
                      {tx.merchantName}
                    </span>
                    <span className="text-xs text-text-muted truncate">
                      {tx.email || userEmail}
                    </span>
                  </div>

                  {/* Right side: Amount with gap between sign and money */}
                  <div className="text-base sm:text-lg font-bold font-mono text-text-primary flex-shrink-0">
                    - ₹{tx.amount.toLocaleString("en-IN", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* UPI QR Scanner Modal */}
      <UpiScannerModal
        isOpen={isQrScannerOpen}
        onClose={closeQrScanner}
        onProceedToPay={handleProceedToPay}
      />

      {/* UPI Payment Modal */}
      <UpiPaymentModal
        isOpen={isPaymentModalOpen}
        merchant={scannedMerchant}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Direct Punch Modal (Opened via + button) */}
      <DirectPunchModal
        isOpen={isDirectPunchOpen}
        onClose={closeDirectPunch}
        onSuccess={handlePaymentSuccess}
        onOpenScanner={() => {
          closeDirectPunch();
          openQrScanner();
        }}
      />

      {/* Monthly Salary Setup Modal (Pops up in a few seconds on Home) */}
      <SalarySetupModal
        isOpen={isSalarySetupOpen}
        onClose={() => setIsSalarySetupOpen(false)}
      />
    </div>
  );
}
