"use client";

import { useEffect, useState } from "react";

const VISITOR_ID_KEY = "wb-visitor-id";

/**
 * Generate a random ID for the current visitor.
 * Format: "v_" + 16 random characters (base36)
 */
function generateVisitorId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  const random2 = Math.random().toString(36).slice(2, 10);
  return `v_${random}${random2}`;
}

/**
 * Read the owner flag from the URL.
 * Returns "owner" if the URL has ?as=owner, otherwise null.
 * Uses window.location — safe because this hook is client-only.
 */
function getOwnerIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("as") === "owner" ? "owner" : null;
}

/**
 * Returns a stable visitor ID.
 *
 * Behavior:
 * - If URL has ?as=owner → returns "owner" (no localStorage interaction)
 * - Otherwise → reads localStorage, or generates + saves a new ID
 *
 * Returns null on first render before the ID is resolved.
 * Components that use this must handle the null case (render nothing
 * until the ID is ready — usually one frame).
 */
export function useVisitorId(): string | null {
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Owner mode: don't touch localStorage at all
    const ownerId = getOwnerIdFromUrl();
    if (ownerId) {
      setVisitorId(ownerId);
      return;
    }

    // Normal mode: read or create a persistent ID
    try {
      const existing = window.localStorage.getItem(VISITOR_ID_KEY);
      if (existing) {
        setVisitorId(existing);
        return;
      }

      const newId = generateVisitorId();
      window.localStorage.setItem(VISITOR_ID_KEY, newId);
      setVisitorId(newId);
    } catch {
      // localStorage blocked (private mode, etc.)
      // Fall back to a session-only ID so the app still works
      setVisitorId(generateVisitorId());
    }
  }, []);

  return visitorId;
}
