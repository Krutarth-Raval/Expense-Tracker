"use client";

import React, { useState } from "react";
import { ArrowLeft, X, Check, Plus } from "lucide-react";
import {
  DEFAULT_PAYMENT_APPS,
  PaymentAppItem,
} from "./PaymentAppIcons";

const CUSTOM_APPS_STORAGE_KEY = "expense_tracker_custom_payment_apps";

interface PaymentAppModalProps {
  isOpen: boolean;
  selectedApp: string | null;
  onSelect: (appName: string, packageOrScheme?: string) => void;
  onClose: () => void;
}

export function PaymentAppModal({
  isOpen,
  selectedApp,
  onSelect,
  onClose,
}: PaymentAppModalProps) {
  const [customApps, setCustomApps] = useState<PaymentAppItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(CUSTOM_APPS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to read custom apps:", e);
    }
    return [];
  });
  const [isAddingApp, setIsAddingApp] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newAppScheme, setNewAppScheme] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newAppName.trim();
    if (!cleanName) {
      setAddError("Please enter an application name");
      return;
    }

    // Check duplicate
    const allCurrentApps = [...DEFAULT_PAYMENT_APPS, ...customApps];
    if (
      allCurrentApps.some(
        (a) => a.name.toLowerCase() === cleanName.toLowerCase()
      )
    ) {
      setAddError("This application is already in the list");
      return;
    }

    const newApp: PaymentAppItem = {
      id: `custom_${Date.now()}`,
      name: cleanName,
      isCustom: true,
      packageOrScheme: newAppScheme.trim() || undefined,
    };

    const updated = [...customApps, newApp];
    setCustomApps(updated);
    try {
      localStorage.setItem(CUSTOM_APPS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn("Failed to save custom app:", err);
    }

    // Auto-select newly added app
    onSelect(newApp.name, newApp.packageOrScheme);
    setNewAppName("");
    setNewAppScheme("");
    setIsAddingApp(false);
    setAddError(null);
  };

  if (!isOpen) return null;

  const allApps: PaymentAppItem[] = [...DEFAULT_PAYMENT_APPS, ...customApps];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-2xl animate-in fade-in duration-200 overflow-hidden">
      {/* Top Navigation Bar */}
      <div
        className="w-[97%] md:w-[95%] lg:w-[85%] max-w-5xl mx-auto flex items-center justify-between px-2 sm:px-4 py-4 border-b border-black/10 dark:border-white/10 select-none"
        style={{
          paddingTop: "max(1rem, env(safe-area-inset-top))",
        }}
      >
        {/* Back Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="w-10 h-10 rounded-full squircle-btn liquid-glass border border-black/15 dark:border-white/20 flex items-center justify-center text-text-primary hover:bg-surface-elevated active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Title */}
        <h2 className="text-base sm:text-lg font-semibold text-text-primary">
          Default Payment App
        </h2>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-10 h-10 rounded-full squircle-btn liquid-glass border border-black/15 dark:border-white/20 flex items-center justify-center text-text-primary hover:bg-surface-elevated active:scale-95 transition-all cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Apps List Container */}
      <div className="flex-1 w-[97%] md:w-[95%] lg:w-[85%] max-w-5xl mx-auto px-2 sm:px-4 py-5 overflow-y-auto flex flex-col gap-3">
        {/* List of Applications (Original Icon and Name Only) */}
        <div className="flex flex-col gap-2.5">
          {allApps.map((app) => {
            const isSelected =
              selectedApp?.toLowerCase() === app.name.toLowerCase();

            return (
              <button
                key={app.id}
                type="button"
                onClick={() => {
                  onSelect(app.name, app.packageOrScheme);
                }}
                className={`w-full p-4 rounded-2xl squircle-card liquid-glass border flex items-center justify-between text-left cursor-pointer active:scale-[0.99] transition-all duration-150 ${
                  isSelected
                    ? "border-black/50 dark:border-white/50 bg-surface-elevated/70 shadow-md ring-1 ring-black/20 dark:ring-white/20"
                    : "border-black/12 dark:border-white/18 hover:bg-surface-elevated/40"
                }`}
              >
                {/* Left: App Name Only (No Icon) */}
                <div className="flex items-center min-w-0 flex-1">
                  <span className="text-base font-semibold text-text-primary truncate">
                    {app.name}
                  </span>
                </div>

                {/* Right: Selection Indicator */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-3 transition-all ${
                    isSelected
                      ? "bg-text-primary text-background shadow-sm"
                      : "border border-black/20 dark:border-white/30 text-transparent"
                  }`}
                >
                  <Check size={14} strokeWidth={2.5} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Add App Option */}
        {!isAddingApp ? (
          <button
            type="button"
            onClick={() => setIsAddingApp(true)}
            aria-label="Add app"
            className="w-full p-4 rounded-2xl squircle-card liquid-glass border border-dashed border-black/20 dark:border-white/25 flex items-center justify-center gap-2.5 text-text-primary hover:bg-surface-elevated/40 active:scale-[0.99] transition-all cursor-pointer font-medium text-sm sm:text-base mt-1"
          >
            <Plus size={18} />
            <span>Add App</span>
          </button>
        ) : (
          <form
            onSubmit={handleAddCustomApp}
            className="w-full p-4 rounded-2xl squircle-card liquid-glass border border-black/20 dark:border-white/30 flex flex-col gap-3 mt-1 animate-in fade-in duration-150"
          >
            <div className="text-sm font-semibold text-text-primary">
              Add Payment Application
            </div>

            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="App Name (e.g. Cred, Amazon Pay)"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                autoFocus
                className="w-full h-11 px-4 rounded-full squircle-input liquid-glass border border-black/15 dark:border-white/20 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-black/50 dark:focus:border-white/50 transition-all"
              />

              <input
                type="text"
                placeholder="Package Name or URI Scheme (optional)"
                value={newAppScheme}
                onChange={(e) => setNewAppScheme(e.target.value)}
                className="w-full h-11 px-4 rounded-full squircle-input liquid-glass border border-black/15 dark:border-white/20 text-xs sm:text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-black/50 dark:focus:border-white/50 transition-all"
              />
            </div>

            {addError && (
              <div className="text-xs text-text-muted font-mono">{addError}</div>
            )}

            <div className="flex items-center gap-2 justify-end mt-1">
              <button
                type="button"
                onClick={() => {
                  setIsAddingApp(false);
                  setAddError(null);
                }}
                className="h-9 px-4 rounded-full squircle-btn liquid-glass border border-black/15 dark:border-white/20 text-xs sm:text-sm font-medium text-text-muted hover:text-text-primary active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-4 rounded-full squircle-btn bg-text-primary text-background text-xs sm:text-sm font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                Add & Select
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
