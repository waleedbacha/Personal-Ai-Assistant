"use client";

import { useCallback, useEffect, useState } from "react";
import type { Reminder } from "@/lib/reminders";

type State = {
  items: Reminder[];
  dueCount: number;
  isLoading: boolean;
  error: string | null;
};

export function useReminders(visitorId: string | null) {
  const [state, setState] = useState<State>({
    items: [],
    dueCount: 0,
    isLoading: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!visitorId) return;

    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const res = await fetch(
        `/api/reminders?visitorId=${encodeURIComponent(visitorId)}`,
        { cache: "no-store" },
      );
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setState((s) => ({
          ...s,
          isLoading: false,
          error: data.error || "Could not load reminders.",
        }));
        return;
      }

      setState({
        items: data.items ?? [],
        dueCount: data.dueCount ?? 0,
        isLoading: false,
        error: null,
      });
    } catch {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: "Network error.",
      }));
    }
  }, [visitorId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const complete = useCallback(
    async (id: string) => {
      if (!visitorId) return;

      // Optimistic update
      setState((s) => ({
        ...s,
        items: s.items.filter((r) => r._id !== id),
        dueCount: Math.max(0, s.dueCount - 1),
      }));

      try {
        await fetch("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId, action: "complete", id }),
        });
      } catch {
        // Re-sync from server on failure
        refresh();
      }
    },
    [visitorId, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!visitorId) return;

      setState((s) => ({
        ...s,
        items: s.items.filter((r) => r._id !== id),
      }));

      try {
        await fetch("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId, action: "delete", id }),
        });
      } catch {
        refresh();
      }
    },
    [visitorId, refresh],
  );

  return {
    items: state.items,
    dueCount: state.dueCount,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
    complete,
    remove,
  };
}
