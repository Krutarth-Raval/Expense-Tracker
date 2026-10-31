"use client";

import React, { createContext, useContext, useState } from "react";
import { NavTab } from "@/components/layout/BottomBar";

interface NavigationContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isQrScannerOpen: boolean;
  openQrScanner: () => void;
  closeQrScanner: () => void;
  isDirectPunchOpen: boolean;
  openDirectPunch: () => void;
  closeDirectPunch: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isDirectPunchOpen, setIsDirectPunchOpen] = useState(false);

  const openQrScanner = () => {
    setActiveTab("home");
    setIsQrScannerOpen(true);
  };
  const closeQrScanner = () => setIsQrScannerOpen(false);

  const openDirectPunch = () => {
    setActiveTab("home");
    setIsDirectPunchOpen(true);
  };
  const closeDirectPunch = () => setIsDirectPunchOpen(false);

  return (
    <NavigationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isQrScannerOpen,
        openQrScanner,
        closeQrScanner,
        isDirectPunchOpen,
        openDirectPunch,
        closeDirectPunch,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}

