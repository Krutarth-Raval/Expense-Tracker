"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "@/context/ThemeContext";

export function SplashScreen({
  duration = 3200,
  onComplete,
}: {
  duration?: number;
  onComplete?: () => void;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [, setIsStopped] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Safety fallback timer so it never hangs indefinitely
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.05,
            filter: "blur(12px)",
            transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background select-none overflow-hidden"
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
            paddingTop: "env(safe-area-inset-top)",
          }}
        >
          {/* Centered Spinning Balls: Pure, borderless, without background card */}
          <div className="relative flex items-center justify-center">
            {/* Spinning Balls Component: Orbits, decelerates smoothly, stops into exact icon shape */}
            <motion.div
              initial={{ rotate: 0, scale: 0.9, opacity: 0 }}
              animate={{
                rotate: [0, 360, 720, 1080],
                scale: 1,
                opacity: 1,
              }}
              transition={{
                rotate: {
                  duration: 1.9,
                  times: [0, 0.3, 0.65, 1],
                  ease: [0.16, 0.85, 0.22, 1], // Smooth acceleration into gradual deceleration to stop
                },
                scale: { duration: 0.35, ease: "easeOut" },
                opacity: { duration: 0.25 },
              }}
              onAnimationComplete={() => {
                // The balls have reached 1080deg (exact 0deg resting angle) and stopped
                setIsStopped(true);
                // Pause for 380ms so the user clearly sees the icon at rest, then open application
                setTimeout(() => {
                  setIsVisible(false);
                  onComplete?.();
                }, 380);
              }}
              className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center select-none pointer-events-none"
            >
              <Image
                src={
                  isDark
                    ? "/icons/spinning-balls-white.png"
                    : "/icons/spinning-balls-black.png"
                }
                alt="Expense Tracker"
                width={128}
                height={128}
                priority
                className="w-full h-full object-contain select-none pointer-events-none"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
