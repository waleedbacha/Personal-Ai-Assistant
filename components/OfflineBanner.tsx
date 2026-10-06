"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="animate-slide-down safe-top fixed left-0 right-0 top-0 z-[60] border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center backdrop-blur-md">
      <p className="text-xs font-medium text-amber-200">
        You&apos;re offline. Messages will send when you reconnect.
      </p>
    </div>
  );
}
