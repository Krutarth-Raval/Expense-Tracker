"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, Sparkles, X, CheckCircle2 } from "lucide-react";
import { APP_VERSION, APP_VERSION_LABEL, APP_DOWNLOAD_ENDPOINT } from "@/lib/version";
import { triggerHaptic } from "@/lib/haptics";

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  latestVersionLabel?: string;
  downloadUrl?: string;
  releaseNotes?: string;
  publishedAt?: string;
}

interface AppUpdateModalProps {
  isOpen: boolean;
  updateInfo: UpdateInfo | null;
  onClose: () => void;
  onUpdate?: () => void;
}

export function AppUpdateModal({
  isOpen,
  updateInfo,
  onClose,
  onUpdate,
}: AppUpdateModalProps) {
  if (!isOpen || !updateInfo) return null;

  const handleUpdateClick = () => {
    triggerHaptic("success");
    if (onUpdate) {
      onUpdate();
    } else {
      const url = updateInfo.downloadUrl || APP_DOWNLOAD_ENDPOINT;
      window.open(url, "_blank");
    }
    onClose();
  };

  const handleDismiss = () => {
    triggerHaptic("light");
    if (typeof window !== "undefined") {
      const key = `dismissed_update_${updateInfo.latestVersion || "latest"}`;
      localStorage.setItem(key, String(Date.now()));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-4 bg-black/35 dark:bg-black/55 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm squircle-card liquid-glass liquid-glass-rim border border-border p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 animate-in zoom-in-95 duration-200">
        {/* Header: Icon on Left, Close on Right */}
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-2xl squircle-icon-sm liquid-glass-control flex items-center justify-center text-text-primary shadow-md">
            <Sparkles size={20} className="text-amber-400 dark:text-amber-300" />
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss update dialog"
            className="w-8 h-8 rounded-full squircle-btn liquid-glass border border-border flex items-center justify-center text-text-primary hover:bg-surface-elevated active:scale-95 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base sm:text-lg font-bold text-text-primary">
            New Update Available
          </h3>
        </div>

        {/* Version Badge Comparison */}
        <div className="p-3 rounded-2xl squircle-card liquid-glass border border-border flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-text-muted">Current</span>
            <span className="text-xs font-mono font-semibold text-text-secondary">
              {APP_VERSION_LABEL}
            </span>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex flex-col items-end">
            <span className="text-[11px] font-medium text-text-muted">New Version</span>
            <span className="text-xs font-mono font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>{updateInfo.latestVersionLabel || `v${updateInfo.latestVersion}`}</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={handleUpdateClick}
            className="h-11 w-full rounded-full squircle-btn bg-text-primary text-background font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-lg"
          >
            <Download size={15} strokeWidth={2.2} />
            <span>Install Latest APK</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="h-9 w-full rounded-full squircle-btn text-xs font-semibold text-text-muted hover:text-text-primary active:scale-98 transition-colors cursor-pointer"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

// Global update checker hook
export function useAppUpdate() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkForUpdate = useCallback(async (isManual = false) => {
    setIsChecking(true);
    try {
      let installedTime: string | null = null;
      if (typeof window !== "undefined") {
        installedTime = localStorage.getItem("app_installed_build_time");
      }

      const query = new URLSearchParams({
        clientVersion: APP_VERSION,
        ...(installedTime ? { installedTime } : {}),
      });

      const res = await fetch(`/api/app-version?${query.toString()}`);
      if (!res.ok) return;

      const data: UpdateInfo = await res.json();
      setUpdateInfo(data);

      if (data.hasUpdate) {
        if (typeof window !== "undefined") {
          const dismissedKey = `dismissed_update_${data.latestVersion || "latest"}`;
          const dismissedAt = localStorage.getItem(dismissedKey);
          const ONE_DAY_MS = 24 * 60 * 60 * 1000;

          // If manual check, always show popup; if auto-check, only show if not dismissed within 24h
          if (isManual || !dismissedAt || Date.now() - Number(dismissedAt) > ONE_DAY_MS) {
            setIsModalOpen(true);
          }
        } else if (isManual) {
          setIsModalOpen(true);
        }
      } else if (isManual) {
        // Trigger subtle haptic on manual check when already up to date
        triggerHaptic("light");
      }
    } catch (err) {
      console.warn("Could not check for updates:", err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Check for updates on mount after brief delay
    const timer = setTimeout(() => {
      checkForUpdate(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [checkForUpdate]);

  return {
    updateInfo,
    isModalOpen,
    isChecking,
    openModal: () => setIsModalOpen(true),
    closeModal: () => setIsModalOpen(false),
    checkForUpdate,
  };
}
