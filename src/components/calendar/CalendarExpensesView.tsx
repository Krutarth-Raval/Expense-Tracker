"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { useAuth } from "@/context/AuthContext";

interface TransactionItem {
  id: string;
  amount: number;
  merchantName: string;
  merchantUpi: string;
  email: string;
  date: string | Date;
}

interface MonthSpentData {
  key: string; // YYYY-MM
  monthName: string; // e.g. "October 2026"
  totalSpent: number;
  year: number;
  monthIndex: number;
  transactions: TransactionItem[];
}

export function CalendarExpensesView() {
  const { user } = useAuth();
  const userEmail = user?.email;

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(userEmail));

  useEffect(() => {
    if (!userEmail) {
      return;
    }

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
        console.warn("Failed to fetch calendar monthly transactions:", err);
      })
      .finally(() => {
        if (isSubscribed) setIsLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [userEmail]);

  // Group transactions by month and compute total spent
  const activeMonths = useMemo(() => {
    const monthMap: Record<string, MonthSpentData> = {};

    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

      if (!monthMap[key]) {
        const monthLabel = d.toLocaleString("en-US", { month: "long" });
        monthMap[key] = {
          key,
          monthName: `${monthLabel} ${year}`,
          totalSpent: 0,
          year,
          monthIndex,
          transactions: [],
        };
      }

      monthMap[key].totalSpent += tx.amount || 0;
      monthMap[key].transactions.push(tx);
    });

    // Filter: if not spent (> 0), then that month is not there
    return Object.values(monthMap)
      .filter((m) => m.totalSpent > 0)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.monthIndex - a.monthIndex;
      });
  }, [transactions]);

  // Format currency
  const formatRupee = (val: number): string => {
    return `₹${Math.abs(val).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  // Generate and download PDF for the selected month
  const downloadMonthPdf = (monthData: MonthSpentData) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // 1. Top: User Email
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text(userEmail || "user@expensetracker.app", 20, y);
    y += 7;

    // 2. Selected Month and Year
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(monthData.monthName, 20, y);
    y += 7;

    // Divider line
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.4);
    doc.line(20, y, pageWidth - 20, y);
    y += 8;

    // 3. Table Column Headers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);

    doc.text("Date", 20, y);
    doc.text("Merchant", 55, y);
    doc.text("UPI ID", 115, y);
    doc.text("Amount", pageWidth - 20, y, { align: "right" });
    y += 3.5;

    doc.setDrawColor(220, 220, 220);
    doc.line(20, y, pageWidth - 20, y);
    y += 6;

    // 4. Details of the Transactions (Zero extra words)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);

    const txList = monthData.transactions;

    txList.forEach((tx) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }

      const d = new Date(tx.date);
      const dateFormatted = `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}`;
      const amountFormatted = `Rs. ${tx.amount.toLocaleString("en-IN")}`;

      doc.text(dateFormatted, 20, y);
      doc.text(tx.merchantName.slice(0, 28), 55, y);
      doc.text((tx.merchantUpi || "").slice(0, 30), 115, y);
      doc.text(amountFormatted, pageWidth - 20, y, { align: "right" });

      y += 6.5;
    });

    const fileName = `${monthData.monthName.replace(/\s+/g, "_")}_Transactions.pdf`;
    doc.save(fileName);
  };

  if (isLoading) {
    return (
      <div className="w-[96%] md:w-[94%] lg:w-[85%] max-w-5xl mx-auto flex flex-col gap-3.5 sm:gap-4 mt-3.5 sm:mt-5 animate-pulse">
        <div className="w-full h-24 rounded-3xl bg-surface-elevated/40" />
      </div>
    );
  }

  // Only show the month cards, nothing else
  return (
    <div className="w-[96%] md:w-[94%] lg:w-[85%] max-w-5xl mx-auto flex flex-col gap-3.5 sm:gap-4 mt-3.5 sm:mt-5 animate-in fade-in duration-200">
      {activeMonths.map((m) => (
        <div
          key={m.key}
          className="w-full squircle-card liquid-glass liquid-glass-rim border border-border p-4 sm:p-5 shadow-xl flex flex-col justify-between min-h-[100px] sm:min-h-[114px]"
        >
          {/* Top Row: Month Name on Top Left, Download Button on Top Right */}
          <div className="flex items-center justify-between w-full">
            <span className="text-xs sm:text-sm font-semibold text-text-secondary leading-tight text-left">
              {m.monthName}
            </span>

            <button
              type="button"
              onClick={() => downloadMonthPdf(m)}
              aria-label={`Download ${m.monthName} PDF`}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full squircle-btn liquid-glass border border-border flex items-center justify-center text-text-primary hover:bg-surface-elevated active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <Download size={16} />
            </button>
          </div>

          {/* Bottom: Large Money Amount on Bottom Left */}
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono tracking-tight text-text-primary text-left truncate mt-3 sm:mt-4">
            {formatRupee(m.totalSpent)}
          </div>
        </div>
      ))}
    </div>
  );
}
