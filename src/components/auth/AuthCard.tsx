"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import { useAuth, AuthScreen } from "@/context/AuthContext";
import { OtpVerification } from "./OtpVerification";

export function AuthCard() {
  const { authScreen, setAuthScreen, login, signup } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Segmented control animation
  const indicatorControls = useAnimationControls();
  const isFirstRender = useRef(true);
  const activeTab = authScreen === "signup" ? "signup" : "login";
  const activeIndex = activeTab === "signup" ? 1 : 0;
  const prevIndexRef = useRef(activeIndex);

  useEffect(() => {
    if (authScreen === "otp") return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      indicatorControls.set({
        x: `${activeIndex * 100}%`,
        scale: 1,
      });
      prevIndexRef.current = activeIndex;
      return;
    }

    if (prevIndexRef.current === activeIndex) {
      return;
    }
    prevIndexRef.current = activeIndex;

    if (shouldReduceMotion) {
      indicatorControls.set({
        x: `${activeIndex * 100}%`,
        scale: 1,
      });
      return;
    }

    // Rule 07 Zoom, Travel & Settle
    indicatorControls.start({
      x: `${activeIndex * 100}%`,
      scale: [1, 1.08, 1],
      transition: {
        x: {
          type: "spring",
          stiffness: 340,
          damping: 28,
          mass: 0.8,
        },
        scale: {
          duration: 0.45,
          times: [0, 0.4, 1],
          ease: [0.16, 1, 0.3, 1],
        },
      },
    });
  }, [activeIndex, authScreen, indicatorControls, shouldReduceMotion]);

  const handleTabSwitch = (screen: AuthScreen) => {
    setError(null);
    setAuthScreen(screen);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    const result = await signup(email, password, confirmPassword);
    setIsSubmitting(false);

    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="w-full max-w-[390px] sm:max-w-[420px] md:max-w-[440px] mx-auto px-3 sm:px-4">
      {/* Reduced inner padding (p-4 sm:p-5.5) for tight, refined Apple Glass capsule aesthetic */}
      <div className="w-full squircle-card liquid-glass liquid-glass-rim border border-black/15 dark:border-white/25 p-4 sm:p-5.5 shadow-2xl transition-all duration-200">
        {authScreen === "otp" ? (
          <OtpVerification onBack={() => setAuthScreen("signup")} />
        ) : (
          <div className="flex flex-col w-full">
            {/* Top Segmented Switcher: Log In / Sign Up */}
            <div className="relative h-11.5 sm:h-12 w-full p-1 rounded-full squircle-nav liquid-glass border border-black/12 dark:border-white/20 flex items-center mb-5">
              {/* Shared Animated Glass Indicator */}
              <motion.div
                className="absolute top-1 bottom-1 rounded-full liquid-glass-active-pill border border-black/15 dark:border-white/30 shadow-md pointer-events-none"
                style={{
                  left: "4px",
                  width: "calc((100% - 8px) / 2)",
                }}
                animate={indicatorControls}
              />

              {/* Log In Tab Button */}
              <button
                type="button"
                onClick={() => handleTabSwitch("login")}
                className={`relative z-10 flex-1 h-full rounded-full squircle-btn text-xs sm:text-sm flex items-center justify-center cursor-pointer select-none transition-colors duration-200 ${
                  activeTab === "login"
                    ? "font-semibold text-text-primary"
                    : "font-medium text-neutral-600 dark:text-neutral-300 hover:text-text-primary"
                }`}
              >
                Log In
              </button>

              {/* Sign Up Tab Button */}
              <button
                type="button"
                onClick={() => handleTabSwitch("signup")}
                className={`relative z-10 flex-1 h-full rounded-full squircle-btn text-xs sm:text-sm flex items-center justify-center cursor-pointer select-none transition-colors duration-200 ${
                  activeTab === "signup"
                    ? "font-semibold text-text-primary"
                    : "font-medium text-neutral-600 dark:text-neutral-300 hover:text-text-primary"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Login Form */}
            {activeTab === "login" ? (
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5 w-full">
                {/* Email Field */}
                <div className="relative flex items-center w-full">
                  <div className="absolute left-3.5 text-text-muted pointer-events-none flex items-center">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="Email"
                    autoComplete="email"
                    className="w-full h-12 sm:h-13 pl-10.5 pr-4 rounded-full squircle-input liquid-glass border border-black/15 dark:border-white/20 text-sm sm:text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-black/50 dark:focus:border-white/60 transition-all duration-150"
                  />
                </div>

                {/* Password Field */}
                <div className="relative flex items-center w-full">
                  <div className="absolute left-3.5 text-text-muted pointer-events-none flex items-center">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="w-full h-12 sm:h-13 pl-10.5 pr-11 rounded-full squircle-input liquid-glass border border-black/15 dark:border-white/20 text-sm sm:text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-black/50 dark:focus:border-white/60 transition-all duration-150"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {/* Validation Error Message */}
                {error && (
                  <div className="text-xs sm:text-sm text-text-muted text-center font-mono py-0.5">
                    {error}
                  </div>
                )}

                {/* Primary Log In Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 sm:h-13 mt-0.5 rounded-full squircle-btn bg-text-primary text-background font-semibold text-sm sm:text-base flex items-center justify-center cursor-pointer select-none shadow-lg hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Log In"
                  )}
                </button>

                {/* Bottom Switcher to Sign Up */}
                <div className="mt-3.5 pt-3 border-t border-black/8 dark:border-white/10 flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                  <span className="text-text-muted">Don&apos;t have an account?</span>
                  <button
                    type="button"
                    onClick={() => handleTabSwitch("signup")}
                    className="font-semibold text-text-primary underline-offset-4 hover:underline cursor-pointer transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignupSubmit} className="flex flex-col gap-3.5 w-full">
                {/* Email Field */}
                <div className="relative flex items-center w-full">
                  <div className="absolute left-3.5 text-text-muted pointer-events-none flex items-center">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="Email"
                    autoComplete="email"
                    className="w-full h-12 sm:h-13 pl-10.5 pr-4 rounded-full squircle-input liquid-glass border border-black/15 dark:border-white/20 text-sm sm:text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-black/50 dark:focus:border-white/60 transition-all duration-150"
                  />
                </div>

                {/* Password Field */}
                <div className="relative flex items-center w-full">
                  <div className="absolute left-3.5 text-text-muted pointer-events-none flex items-center">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Password"
                    autoComplete="new-password"
                    className="w-full h-12 sm:h-13 pl-10.5 pr-11 rounded-full squircle-input liquid-glass border border-black/15 dark:border-white/20 text-sm sm:text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-black/50 dark:focus:border-white/60 transition-all duration-150"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {/* Confirm Password Field */}
                <div className="relative flex items-center w-full">
                  <div className="absolute left-3.5 text-text-muted pointer-events-none flex items-center">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    className="w-full h-12 sm:h-13 pl-10.5 pr-11 rounded-full squircle-input liquid-glass border border-black/15 dark:border-white/20 text-sm sm:text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-black/50 dark:focus:border-white/60 transition-all duration-150"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1"
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {/* Validation Error Message */}
                {error && (
                  <div className="text-xs sm:text-sm text-text-muted text-center font-mono py-0.5">
                    {error}
                  </div>
                )}

                {/* Sign Up Button (Redirects to OTP screen) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 sm:h-13 mt-0.5 rounded-full squircle-btn bg-text-primary text-background font-semibold text-sm sm:text-base flex items-center justify-center cursor-pointer select-none shadow-lg hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Sign Up"
                  )}
                </button>

                {/* Bottom Switcher to Log In */}
                <div className="mt-3.5 pt-3 border-t border-black/8 dark:border-white/10 flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                  <span className="text-text-muted">Already have an account?</span>
                  <button
                    type="button"
                    onClick={() => handleTabSwitch("login")}
                    className="font-semibold text-text-primary underline-offset-4 hover:underline cursor-pointer transition-colors"
                  >
                    Log In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
