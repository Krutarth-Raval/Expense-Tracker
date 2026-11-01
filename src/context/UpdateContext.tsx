"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { AppUpdateModal, UpdateInfo } from "@/components/common/AppUpdateModal";
import { APP_VERSION } from "@/lib/version";
import { triggerHaptic } from "@/lib/haptics";

interface UpdateContextValue {
  updateInfo: UpdateInfo | null;
  isChecking: boolean;
  checkForUpdates: (manual?: boolean) => Promise<void>;
  openUpdateModal: () => void;
  closeUpdateModal: () => void;
}

const UpdateContext = createContext<UpdateContextValue | undefined>(undefined);

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkForUpdates = useCallback(async (isManual = false) => {
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

          if (isManual || !dismissedAt || Date.now() - Number(dismissedAt) > ONE_DAY_MS) {
            setIsModalOpen(true);
          }
        } else if (isManual) {
          setIsModalOpen(true);
        }
      } else if (isManual) {
        triggerHaptic("light");
      }
    } catch (err) {
      console.warn("Update check failed:", err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Check for updates on mount after brief delay
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 2800);

    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  const value = useMemo(
    () => ({
      updateInfo,
      isChecking,
      checkForUpdates,
      openUpdateModal: () => setIsModalOpen(true),
      closeUpdateModal: () => setIsModalOpen(false),
    }),
    [updateInfo, isChecking, checkForUpdates]
  );

  return (
    <UpdateContext.Provider value={value}>
      {children}
      <AppUpdateModal
        isOpen={isModalOpen}
        updateInfo={updateInfo}
        onClose={() => setIsModalOpen(false)}
      />
    </UpdateContext.Provider>
  );
}

export function useUpdate(): UpdateContextValue {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error("useUpdate must be used within an UpdateProvider");
  }
  return context;
}

