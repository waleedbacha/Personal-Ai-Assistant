"use client";

export function useHaptics() {
  const tap = (ms = 10) => {
    if (typeof navigator === "undefined") return;
    if (!("vibrate" in navigator)) return;
    try {
      navigator.vibrate(ms);
    } catch {
      // ignore — some browsers throw when vibration is blocked
    }
  };

  const double = () => {
    if (typeof navigator === "undefined") return;
    if (!("vibrate" in navigator)) return;
    try {
      navigator.vibrate([8, 40, 8]);
    } catch {}
  };

  return { tap, double };
}
