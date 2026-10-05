"use client";

import { useState, useEffect, useCallback } from "react";

const VISITS_KEY = "pwa-visits";
const DISMISSED_KEY = "pwa-dismissed-at";
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MIN_VISITS_BEFORE_SHOW = 2;

type PromptOutcome = "accepted" | "dismissed" | null;

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [shouldShowBanner, setShouldShowBanner] = useState(false);

  useEffect(() => {
    // Already installed / launched as standalone?
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Track visit count
    const visits = parseInt(localStorage.getItem(VISITS_KEY) || "0", 10) + 1;
    localStorage.setItem(VISITS_KEY, String(visits));

    // Has the user dismissed recently?
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    const recentlyDismissed =
      dismissedAt &&
      Date.now() - parseInt(dismissedAt, 10) < DISMISS_DURATION_MS;

    const handleBeforeInstall = (e: Event) => {
      // Required — prevents the mini-infobar on mobile Chrome
      e.preventDefault();
      setDeferredPrompt(e);

      if (visits >= MIN_VISITS_BEFORE_SHOW && !recentlyDismissed) {
        setShouldShowBanner(true);
      }
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setShouldShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<PromptOutcome> => {
    if (!deferredPrompt) return null;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      const outcome: PromptOutcome = choice?.outcome ?? null;

      setDeferredPrompt(null);
      setShouldShowBanner(false);

      return outcome;
    } catch {
      setDeferredPrompt(null);
      setShouldShowBanner(false);
      return null;
    }
  }, [deferredPrompt]);

  const dismissBanner = useCallback((dontShowAgain = false) => {
    setShouldShowBanner(false);
    if (dontShowAgain) {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    }
  }, []);

  return {
    canPrompt: !!deferredPrompt,
    isInstalled,
    shouldShowBanner,
    promptInstall,
    dismissBanner,
  };
}
