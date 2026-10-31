"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  HouseIcon,
  CalendarDaysIcon,
  UserRoundIcon,
  PlusIcon,
  QrCodeIcon,
} from "@animateicons/react/lucide";
import { motion, useAnimationControls, useReducedMotion } from "motion/react";

export type NavTab = "calendar" | "home" | "profile" | "summary";

export interface BottomBarProps {
  initialTab?: NavTab;
  currentTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  onScanQrClick?: () => void;
  onPlusActionClick?: () => void;
}

interface IconRefHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

const TAB_INDEX_MAP: Record<string, number> = {
  calendar: 0,
  summary: 0,
  home: 1,
  profile: 2,
};

export function BottomBar({
  initialTab = "home",
  currentTab,
  onTabChange,
  onScanQrClick,
  onPlusActionClick,
}: BottomBarProps) {
  // Internal tab state if uncontrolled
  const [internalTab, setInternalTab] = useState<NavTab>(initialTab);
  const activeTab = currentTab ?? internalTab;
  const activeTabIndex = TAB_INDEX_MAP[activeTab] ?? 1;

  // Single shared glass indicator animation controls
  const indicatorControls = useAnimationControls();
  const isFirstRender = useRef(true);
  const prevTabIndexRef = useRef(activeTabIndex);

  // Accessibility: respect reduced motion preferences
  const shouldReduceMotion = useReducedMotion();

  // Action expansion popup state
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<"qr" | "plus" | null>(null);

  // Icon refs for @animateicons/react animation triggers
  const calendarIconRef = useRef<IconRefHandle>(null);
  const homeIconRef = useRef<IconRefHandle>(null);
  const profileIconRef = useRef<IconRefHandle>(null);
  const mainPlusIconRef = useRef<IconRefHandle>(null);
  const qrIconRef = useRef<IconRefHandle>(null);
  const actionPlusIconRef = useRef<IconRefHandle>(null);

  // Zoom, Travel & Settle sequence for the shared glass indicator
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      indicatorControls.set({
        x: `${activeTabIndex * 100}%`,
        scale: 1,
      });
      prevTabIndexRef.current = activeTabIndex;
      return;
    }

    if (prevTabIndexRef.current === activeTabIndex) {
      return;
    }
    prevTabIndexRef.current = activeTabIndex;

    if (shouldReduceMotion) {
      indicatorControls.set({
        x: `${activeTabIndex * 100}%`,
        scale: 1,
      });
      return;
    }

    // Phase 1: Zoom In (1.0 -> 1.12 with elevation)
    // Phase 2: Smooth Travel (rigid rounded squircle travel, no stretch)
    // Phase 3: Settle (1.12 -> 1.0, aligns and settles naturally)
    indicatorControls.start({
      x: `${activeTabIndex * 100}%`,
      scale: [1, 1.12, 1],
      transition: {
        x: {
          type: "spring",
          stiffness: 310,
          damping: 26,
          mass: 0.85,
        },
        scale: {
          duration: 0.48,
          times: [0, 0.38, 1],
          ease: [0.16, 1, 0.3, 1],
        },
      },
    });
  }, [activeTabIndex, indicatorControls, shouldReduceMotion]);

  // Close popup when escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isActionOpen) {
        setIsActionOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActionOpen]);

  // Tab change handler
  const handleSelectTab = useCallback(
    (tab: NavTab) => {
      if (!currentTab) {
        setInternalTab(tab);
      }
      onTabChange?.(tab);

      // Trigger animation for the tapped icon
      if (tab === "calendar" || tab === "summary") {
        calendarIconRef.current?.startAnimation();
      } else if (tab === "home") {
        homeIconRef.current?.startAnimation();
      } else if (tab === "profile") {
        profileIconRef.current?.startAnimation();
      }

      // Close action popup if open
      if (isActionOpen) {
        setIsActionOpen(false);
      }
    },
    [currentTab, onTabChange, isActionOpen]
  );

  // Toggle Plus action button (which morphs to cross when open)
  const handleTogglePlusAction = () => {
    setIsActionOpen((prev) => !prev);
    mainPlusIconRef.current?.startAnimation();
  };

  // Action item 1: QR button
  const handleQrButton = () => {
    qrIconRef.current?.startAnimation();
    setSelectedAction("qr");
    onScanQrClick?.();
    setTimeout(() => {
      setIsActionOpen(false);
      setSelectedAction(null);
    }, 280);
  };

  // Action item 2: Plus button
  const handlePlusButton = () => {
    actionPlusIconRef.current?.startAnimation();
    setSelectedAction("plus");
    onPlusActionClick?.();
    setTimeout(() => {
      setIsActionOpen(false);
      setSelectedAction(null);
    }, 280);
  };

  const isCalendarActive = activeTab === "calendar" || activeTab === "summary";
  const isHomeActive = activeTab === "home";
  const isProfileActive = activeTab === "profile";

  return (
    <>
      {/* Click-outside backdrop when action menu is expanded */}
      {isActionOpen && (
        <div
          role="button"
          tabIndex={-1}
          aria-label="Close action menu"
          onClick={() => setIsActionOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 dark:bg-black/55 backdrop-blur-[2px] transition-opacity duration-200 pointer-events-auto"
        />
      )}

      {/* Floating Bottom Bar Container with generous responsive width & safe device edge padding */}
      <nav
        aria-label="Bottom Navigation Bar"
        className="fixed bottom-3 sm:bottom-5 inset-x-0 z-50 flex items-center justify-center pointer-events-none px-3.5 sm:px-5 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="pointer-events-auto w-full max-w-[340px] sm:max-w-[400px] md:max-w-[440px] flex items-center justify-center gap-2.5 sm:gap-3.5 relative">
          {/* Main Navigation Capsule */}
          <div
            className="relative flex-1 h-14 sm:h-16 p-1.5 rounded-full squircle-nav liquid-glass liquid-glass-rim border border-black/15 dark:border-white/25 flex items-center shadow-2xl transition-all duration-200"
          >
            {/* Single Shared Animated Glass Indicator: Zoom, Travel, and Settle */}
            <motion.div
              className="absolute top-1.5 bottom-1.5 rounded-full liquid-glass-active-pill border border-black/15 dark:border-white/30 shadow-lg pointer-events-none"
              style={{
                left: "6px",
                width: "calc((100% - 12px) / 3)",
              }}
              animate={indicatorControls}
            />

            {/* 1. Calendar Button (Left side of Home, icon-only) */}
            <button
              type="button"
              onClick={() => handleSelectTab("calendar")}
              onMouseEnter={() => calendarIconRef.current?.startAnimation()}
              aria-label="Calendar"
              aria-current={isCalendarActive ? "page" : undefined}
              className="relative z-10 flex-1 h-full rounded-full squircle-btn flex items-center justify-center cursor-pointer select-none focus:outline-none"
            >
              <div
                className={`flex items-center justify-center transition-colors duration-200 ${
                  isCalendarActive
                    ? "text-text-primary"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <CalendarDaysIcon
                  ref={calendarIconRef}
                  size={24}
                  className="transition-colors duration-150"
                />
              </div>
            </button>

            {/* 2. Home Button (Middle, icon-only) */}
            <button
              type="button"
              onClick={() => handleSelectTab("home")}
              onMouseEnter={() => homeIconRef.current?.startAnimation()}
              aria-label="Home"
              aria-current={isHomeActive ? "page" : undefined}
              className="relative z-10 flex-1 h-full rounded-full squircle-btn flex items-center justify-center cursor-pointer select-none focus:outline-none"
            >
              <div
                className={`flex items-center justify-center transition-colors duration-200 ${
                  isHomeActive
                    ? "text-text-primary"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <HouseIcon
                  ref={homeIconRef}
                  size={24}
                  className="transition-colors duration-150"
                />
              </div>
            </button>

            {/* 3. User Profile Button (Right of Home, uses user icon from spec) */}
            <button
              type="button"
              onClick={() => handleSelectTab("profile")}
              onMouseEnter={() => profileIconRef.current?.startAnimation()}
              aria-label="User Profile"
              aria-current={isProfileActive ? "page" : undefined}
              className="relative z-10 flex-1 h-full rounded-full squircle-btn flex items-center justify-center cursor-pointer select-none focus:outline-none"
            >
              <div
                className={`flex items-center justify-center transition-colors duration-200 ${
                  isProfileActive
                    ? "text-text-primary"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <UserRoundIcon
                  ref={profileIconRef}
                  size={24}
                  className="transition-colors duration-150"
                />
              </div>
            </button>
          </div>

          {/* Plus Action Button Section (Taller than bottom bar height) */}
          <div className="relative flex flex-col items-center flex-shrink-0">
            {/* Pop-up Action Menu: Two separate circular liquid glass buttons (No text) */}
            {isActionOpen && (
              <div
                role="menu"
                aria-label="Quick Actions"
                className="absolute bottom-[calc(100%+14px)] right-0 flex flex-col items-center gap-3 transition-all duration-200"
              >
                {/* 1. Separate QR Code Button */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleQrButton}
                  onMouseEnter={() => qrIconRef.current?.startAnimation()}
                  aria-label="Scan QR Code"
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full squircle-control liquid-glass liquid-glass-rim border border-black/15 dark:border-white/25 flex items-center justify-center cursor-pointer select-none shadow-2xl active:scale-90 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 zoom-in-90 ${
                    selectedAction === "qr"
                      ? "liquid-glass-active-pill text-text-primary"
                      : "text-text-primary hover:bg-surface-elevated"
                  }`}
                >
                  <QrCodeIcon
                    ref={qrIconRef}
                    size={26}
                    className="transition-colors duration-150"
                  />
                </button>

                {/* 2. Separate PLUS Button */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={handlePlusButton}
                  onMouseEnter={() => actionPlusIconRef.current?.startAnimation()}
                  aria-label="Add Transaction"
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full squircle-control liquid-glass liquid-glass-rim border border-black/15 dark:border-white/25 flex items-center justify-center cursor-pointer select-none shadow-2xl active:scale-90 transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 zoom-in-90 ${
                    selectedAction === "plus"
                      ? "liquid-glass-active-pill text-text-primary"
                      : "text-text-primary hover:bg-surface-elevated"
                  }`}
                >
                  <PlusIcon
                    ref={actionPlusIconRef}
                    size={26}
                    className="transition-colors duration-150"
                  />
                </button>
              </div>
            )}

            {/* Bottom Bar Plus Trigger Button - Taller than bottom bar (e.g. 64px vs 56px) */}
            <button
              type="button"
              onClick={handleTogglePlusAction}
              onMouseEnter={() => mainPlusIconRef.current?.startAnimation()}
              aria-label={isActionOpen ? "Close Quick Actions" : "Open Quick Actions"}
              aria-expanded={isActionOpen}
              className={`h-15 w-15 sm:h-16 sm:w-16 rounded-full squircle-control liquid-glass liquid-glass-rim border border-black/15 dark:border-white/25 flex items-center justify-center cursor-pointer select-none shadow-2xl active:scale-95 transition-all duration-200 ${
                isActionOpen
                  ? "liquid-glass-active-pill text-text-primary border-white/30 dark:border-white/40"
                  : "text-text-primary hover:bg-surface-elevated"
              }`}
            >
              {/* Rotating Plus smoothly transforms into Cross (X) */}
              <div
                className={`flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isActionOpen ? "rotate-45" : "rotate-0"
                }`}
              >
                <PlusIcon
                  ref={mainPlusIconRef}
                  size={26}
                  className="transition-colors duration-150"
                />
              </div>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
