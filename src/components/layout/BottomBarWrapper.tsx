"use client";

import React from "react";
import { BottomBar } from "./BottomBar";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";

export function BottomBarWrapper() {
  const { isAuthenticated, isLoading } = useAuth();
  const { activeTab, setActiveTab, openQrScanner, openDirectPunch } = useNavigation();

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <BottomBar
      currentTab={activeTab}
      onTabChange={setActiveTab}
      onScanQrClick={openQrScanner}
      onPlusActionClick={openDirectPunch}
    />
  );
}
