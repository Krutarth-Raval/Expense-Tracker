"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  UserRoundIcon,
  LogOut,
  CalendarDays,
  IndianRupee,
  CreditCard,
  Check,
  Pencil,
  Download,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DayWheelPicker } from "./DayWheelPicker";
import { PaymentAppModal } from "./PaymentAppModal";
import { PaymentAppIcon, DEFAULT_PAYMENT_APPS } from "./PaymentAppIcons";

export function ProfileCard() {
  const { user, logout, updateUserProfile } = useAuth();
  const userEmail = user?.email;

  // Saved states
  const [salaryDay, setSalaryDay] = useState<number>(() => {
    if (user?.salaryDay) return user.salaryDay;
    if (user?.salaryDate) return new Date(user.salaryDate).getUTCDate();
    return 1;
  });

  const [salaryAmount, setSalaryAmount] = useState<string>(() => {
    return user?.salaryAmount !== null && user?.salaryAmount !== undefined
      ? String(user.salaryAmount)
      : "";
  });

  const [defaultPaymentApp, setDefaultPaymentApp] = useState<string | null>(() => {
    return user?.defaultPaymentApp || null;
  });

  // Edit mode states (Drafts)
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [draftSalaryDay, setDraftSalaryDay] = useState<number>(salaryDay);
  const [draftSalaryAmount, setDraftSalaryAmount] = useState<string>(salaryAmount);

  // UI action states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSavingSalary, setIsSavingSalary] = useState(false);
  const [salarySaveSuccess, setSalarySaveSuccess] = useState(false);
  const [salaryError, setSalaryError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper for ordinal suffix: 1st, 2nd, 3rd...
  const formatDay = (d: number) => {
    if (d >= 11 && d <= 13) return `${d}th`;
    switch (d % 10) {
      case 1:
        return `${d}st`;
      case 2:
        return `${d}nd`;
      case 3:
        return `${d}rd`;
      default:
        return `${d}th`;
    }
  };

  // Helper for formatting Indian Rupee currency (₹)
  const formatAmount = (val: string | number | null | undefined) => {
    if (val === null || val === undefined || String(val).trim() === "") {
      return "₹0";
    }
    const num = parseFloat(String(val));
    if (isNaN(num)) return "₹0";
    return `₹${num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  // Fetch full user profile from database on mount to sync any recent updates
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
            : 1;

          setSalaryDay(freshDay);
          setDraftSalaryDay(freshDay);

          const freshAmount =
            freshUser.salaryAmount !== null && freshUser.salaryAmount !== undefined
              ? String(freshUser.salaryAmount)
              : "";
          setSalaryAmount(freshAmount);
          setDraftSalaryAmount(freshAmount);

          if (freshUser.defaultPaymentApp) {
            setDefaultPaymentApp(freshUser.defaultPaymentApp);
          }
          updateUserProfile(freshUser);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch fresh user profile:", err);
      });
  }, [userEmail, updateUserProfile]);

  // Enter edit mode
  const handleStartEdit = () => {
    setDraftSalaryDay(salaryDay);
    setDraftSalaryAmount(salaryAmount);
    setSalaryError(null);
    setIsEditingSalary(true);
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setDraftSalaryDay(salaryDay);
    setDraftSalaryAmount(salaryAmount);
    setSalaryError(null);
    setIsEditingSalary(false);
  };

  // Save Salary Date & Amount to Database via Save Button
  const handleSaveSalary = async () => {
    if (!userEmail) return;

    setIsSavingSalary(true);
    setSalaryError(null);

    const numericAmount =
      draftSalaryAmount.trim() !== "" ? parseFloat(draftSalaryAmount) : null;

    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          salaryDay: draftSalaryDay,
          salaryAmount: numericAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSalaryError(data.error || "Failed to save salary settings");
        return;
      }

      // Update confirmed state
      setSalaryDay(draftSalaryDay);
      setSalaryAmount(draftSalaryAmount);
      updateUserProfile({
        salaryDay: draftSalaryDay,
        salaryAmount: numericAmount,
        salaryConfigured: true,
      });

      if (typeof window !== "undefined") {
        localStorage.setItem(`salary_configured_${userEmail}`, "true");
      }

      // Exit edit mode back to view mode
      setIsEditingSalary(false);
      setSalarySaveSuccess(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        setSalarySaveSuccess(false);
      }, 2500);
    } catch (err) {
      console.error("Save salary settings error:", err);
      setSalaryError("Network error. Please try again.");
    } finally {
      setIsSavingSalary(false);
    }
  };

  // Select Default Payment App & Save to Database
  const handleSelectPaymentApp = useCallback(
    async (appName: string) => {
      setDefaultPaymentApp(appName);
      setIsPaymentModalOpen(false);

      if (!userEmail) return;

      try {
        const res = await fetch("/api/user/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            defaultPaymentApp: appName,
          }),
        });

        const data = await res.json();
        if (data.success) {
          updateUserProfile({ defaultPaymentApp: appName });
        }
      } catch (err) {
        console.error("Save default payment app error:", err);
      }
    },
    [userEmail, updateUserProfile]
  );

  // Helper to find selected payment app details
  const matchedApp = DEFAULT_PAYMENT_APPS.find(
    (app) => app.name.toLowerCase() === defaultPaymentApp?.toLowerCase()
  );

  return (
    <div className="w-[96%] md:w-[94%] lg:w-[85%] max-w-5xl mx-auto flex flex-col gap-3.5 sm:gap-4 mt-3.5 sm:mt-5 animate-in fade-in zoom-in-95 duration-200">
      {/* =========================================================================
          SECTION 1: USER DETAILS (Avatar on left, Email on right, Sign Out below email)
          ========================================================================= */}
      <div className="w-full squircle-card liquid-glass liquid-glass-rim border border-black/15 dark:border-white/20 p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-3.5 sm:gap-4">
          {/* Avatar on Left */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full squircle-control liquid-glass border border-black/15 dark:border-white/25 flex items-center justify-center text-text-primary flex-shrink-0 shadow-sm">
            <UserRoundIcon size={28} strokeWidth={1.8} className="sm:hidden" />
            <UserRoundIcon size={32} strokeWidth={1.8} className="hidden sm:block" />
          </div>

          {/* Right Side: Email + Sign Out below email */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="text-sm sm:text-base font-semibold text-text-primary truncate">
              {userEmail || "user@expensetracker.app"}
            </div>

            {/* Sign Out Button below email */}
            <div className="mt-2.5">
              <button
                type="button"
                onClick={logout}
                aria-label="Sign Out"
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full squircle-btn liquid-glass border border-black/15 dark:border-white/20 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-surface-elevated active:scale-95 transition-all cursor-pointer select-none"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: SALARY SETTINGS (Date & Amount in SAME Section)
          - View Mode: Shows date & amount directly with "Edit" button
          - Edit Mode: Shows vertical 3-date drum wheel & input field with "Save" / "Cancel"
          ========================================================================= */}
      <div className="w-full squircle-card liquid-glass liquid-glass-rim border border-black/15 dark:border-white/20 p-4 sm:p-5 shadow-xl flex flex-col gap-3.5">
        {/* Row 1: Salary Date (Icon + Title on Left, Date on Right in SAME row) */}
        <div className="flex items-center justify-between gap-3 min-h-[44px]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl squircle-icon-sm liquid-glass border border-black/12 dark:border-white/18 flex items-center justify-center text-text-primary flex-shrink-0">
              <CalendarDays size={18} />
            </div>
            <span className="text-sm sm:text-base font-semibold text-text-primary truncate">
              Salary Date
            </span>
          </div>

          {/* Right: Only in Edit Mode show 3 dates; otherwise show date directly */}
          <div className="flex-shrink-0 flex items-center justify-end">
            {isEditingSalary ? (
              <DayWheelPicker
                value={draftSalaryDay}
                onChange={(newDay) => setDraftSalaryDay(newDay)}
              />
            ) : (
              <span className="font-mono font-bold text-sm sm:text-base text-text-primary">
                {formatDay(salaryDay)}
              </span>
            )}
          </div>
        </div>

        {/* Divider line between Date and Amount */}
        <div className="w-full border-b border-black/8 dark:border-white/10" />

        {/* Row 2: Salary Amount (Rupee Icon + Title on Left, Rupee Amount on Right in SAME row) */}
        <div className="flex items-center justify-between gap-3 min-h-[44px]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl squircle-icon-sm liquid-glass border border-black/12 dark:border-white/18 flex items-center justify-center text-text-primary flex-shrink-0">
              <IndianRupee size={18} />
            </div>
            <span className="text-sm sm:text-base font-semibold text-text-primary truncate">
              Salary Amount
            </span>
          </div>

          {/* Right: Only in Edit Mode show input field; otherwise show amount directly with Rupee sign */}
          <div className="flex-shrink-0 flex items-center justify-end">
            {isEditingSalary ? (
              <div className="relative w-32 sm:w-36">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted font-mono font-medium text-xs sm:text-sm pointer-events-none">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={draftSalaryAmount}
                  onChange={(e) => setDraftSalaryAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveSalary();
                    }
                  }}
                  autoFocus
                  aria-label="Salary Amount"
                  className="w-full h-10 pl-7 pr-3 rounded-full squircle-input liquid-glass border border-black/15 dark:border-white/20 text-xs sm:text-sm font-mono font-medium text-text-primary text-right placeholder:text-text-muted focus:outline-none focus:border-black/50 dark:focus:border-white/50 transition-all"
                />
              </div>
            ) : (
              <span className="font-mono font-bold text-sm sm:text-base text-text-primary">
                {formatAmount(salaryAmount)}
              </span>
            )}
          </div>
        </div>

        {/* Error notice if saving fails */}
        {salaryError && (
          <div className="text-xs text-text-muted font-mono">{salaryError}</div>
        )}

        {/* Action Buttons: "Edit" when viewing, "Save" + "Cancel" when editing */}
        <div className="w-full pt-1">
          {isEditingSalary ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSavingSalary}
                aria-label="Cancel editing"
                className="h-10 px-4 rounded-full squircle-btn liquid-glass border border-black/15 dark:border-white/20 text-xs sm:text-sm font-medium text-text-muted hover:text-text-primary active:scale-95 transition-all cursor-pointer select-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSalary}
                disabled={isSavingSalary}
                aria-label="Save Salary Settings"
                className="flex-1 h-10 rounded-full squircle-btn bg-text-primary text-background font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all duration-150 shadow-md hover:opacity-90 disabled:opacity-50"
              >
                {isSavingSalary ? (
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Save</span>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartEdit}
              aria-label="Edit salary date and amount"
              className="w-full h-10 rounded-full squircle-btn liquid-glass border border-black/15 dark:border-white/20 text-text-primary hover:bg-surface-elevated font-medium text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all duration-150 select-none"
            >
              <Pencil size={14} />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtle Save Confirmation */}
      {salarySaveSuccess && (
        <div className="w-full flex justify-center py-0.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-elevated/70 border border-black/10 dark:border-white/15 text-[11px] font-mono text-text-muted">
            <Check size={12} strokeWidth={2.5} className="text-text-primary" />
            <span>Saved to Database</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 3: DEFAULT PAYMENT APP (Icon + Title on Left, "Select" on Right in SAME row)
          ========================================================================= */}
      <div className="w-full squircle-card liquid-glass liquid-glass-rim border border-black/15 dark:border-white/20 p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between gap-2.5 sm:gap-3">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl squircle-icon-sm liquid-glass border border-black/12 dark:border-white/18 flex items-center justify-center text-text-primary flex-shrink-0">
              {matchedApp ? (
                <PaymentAppIcon id={matchedApp.id} className="w-5 h-5" />
              ) : (
                <CreditCard size={18} />
              )}
            </div>

            <span className="text-xs xs:text-sm sm:text-base font-semibold text-text-primary truncate">
              Default Payment App
            </span>
          </div>

          {/* Right: If not selected, show JUST "Select" text. If selected, show app name pill. */}
          <div className="flex-shrink-0">
            {defaultPaymentApp ? (
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                aria-label={`Selected: ${defaultPaymentApp}. Click to change.`}
                className="h-9 px-3 sm:px-3.5 rounded-full squircle-btn liquid-glass border border-black/15 dark:border-white/25 text-xs sm:text-sm font-medium text-text-primary hover:bg-surface-elevated active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none"
              >
                {matchedApp && (
                  <PaymentAppIcon id={matchedApp.id} className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="truncate max-w-[100px] xs:max-w-[130px] sm:max-w-[160px]">
                  {defaultPaymentApp}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                aria-label="Select default payment app"
                className="h-9 px-4 rounded-full squircle-btn liquid-glass border border-black/15 dark:border-white/25 text-xs sm:text-sm font-medium text-text-primary hover:bg-surface-elevated active:scale-95 transition-all cursor-pointer select-none"
              >
                Select
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: DOWNLOAD APPLICATION (GitHub Release Install Option)
          ========================================================================= */}
      <div className="w-full squircle-card liquid-glass liquid-glass-rim border border-black/15 dark:border-white/20 p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between gap-2.5 sm:gap-3">
          {/* Left: Icon + Title & Subtitle */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl squircle-icon-sm liquid-glass border border-black/12 dark:border-white/18 flex items-center justify-center text-text-primary flex-shrink-0">
              <Download size={18} />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-xs xs:text-sm sm:text-base font-semibold text-text-primary truncate">
                Download Application
              </span>
              <span className="text-[11px] sm:text-xs text-text-muted truncate">
                Latest GitHub Release
              </span>
            </div>
          </div>

          {/* Right: Install Button */}
          <div className="flex-shrink-0">
            <a
              href="/api/app-download"
              target="_blank"
              rel="noopener noreferrer"
              download
              aria-label="Download and install application"
              className="h-9 px-4 rounded-full squircle-btn bg-text-primary text-background font-semibold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all duration-150 shadow-md hover:opacity-90 select-none"
            >
              <Download size={14} strokeWidth={2.2} />
              <span>Install</span>
            </a>
          </div>
        </div>
      </div>

      {/* Full-Screen Payment Applications Selection Modal */}
      <PaymentAppModal
        isOpen={isPaymentModalOpen}
        selectedApp={defaultPaymentApp}
        onSelect={handleSelectPaymentApp}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </div>
  );
}
