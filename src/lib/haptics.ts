/**
 * Haptic Vibration Feedback Utility for Mobile & Capacitor Application Mode
 * Supports discrete tactile vibration pulses for touch feedback across the app.
 */

export type HapticType = "light" | "medium" | "heavy" | "double" | "success" | "error";

export function triggerHaptic(type: HapticType = "light"): void {
  if (typeof window === "undefined" || !navigator || typeof navigator.vibrate !== "function") {
    return;
  }

  try {
    switch (type) {
      case "light":
        navigator.vibrate(15);
        break;
      case "medium":
        navigator.vibrate(30);
        break;
      case "heavy":
        navigator.vibrate(55);
        break;
      case "double":
        // Distinct double-pulse for double-tap / double-click
        navigator.vibrate([18, 50, 22]);
        break;
      case "success":
        navigator.vibrate([15, 35, 35]);
        break;
      case "error":
        navigator.vibrate([40, 60, 40]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {
    // Non-blocking fail-safe for restricted environments
  }
}

