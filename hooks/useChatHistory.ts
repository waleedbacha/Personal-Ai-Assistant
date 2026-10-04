"use client";

import { useCallback, useEffect, useState } from "react";
import type { UIMessage } from "ai";
import type { ChatMode } from "@/lib/buildSystemPrompt";

// ------------------------------------------------------------
// Storage shape
// ------------------------------------------------------------

const STORAGE_KEY = "wb-chat-history-v1";
const MAX_SESSIONS = 20;

export type ChatSession = {
  id: string;
  /** First user message, trimmed — used as the drawer title */
  title: string;
  /** Unix ms of the last activity in this session */
  updatedAt: number;
  /** The mode that was active when this session was saved */
  mode: ChatMode;
  /** The full message list */
  messages: UIMessage[];
};

// ------------------------------------------------------------
// Safe read/write — never crash the app on a bad payload
// ------------------------------------------------------------

function readSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Loose shape check — drop anything malformed
    return parsed.filter(
      (s) =>
        s &&
        typeof s.id === "string" &&
        typeof s.title === "string" &&
        typeof s.updatedAt === "number" &&
        Array.isArray(s.messages),
    );
  } catch {
    return [];
  }
}

function writeSessions(sessions: ChatSession[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Quota exceeded or private mode — silently skip
  }
}

// ------------------------------------------------------------
// Utilities
// ------------------------------------------------------------

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Derive a short title from the first user message in a session.
 * Falls back to "New conversation" if there's no user text yet.
 */
function deriveTitle(messages: UIMessage[]): string {
  for (const m of messages) {
    if (m.role !== "user") continue;
    const text = m.parts
      ?.filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("")
      .trim();
    if (text) {
      return text.length > 60 ? text.slice(0, 60) + "…" : text;
    }
  }
  return "New conversation";
}

/**
 * A session is worth saving only if it has at least one user
 * message AND one assistant reply with content.
 */
function isWorthSaving(messages: UIMessage[]): boolean {
  let hasUser = false;
  let hasAssistant = false;
  for (const m of messages) {
    const text = m.parts
      ?.filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("")
      .trim();
    if (!text) continue;
    if (m.role === "user") hasUser = true;
    if (m.role === "assistant") hasAssistant = true;
  }
  return hasUser && hasAssistant;
}

// ------------------------------------------------------------
// Public hook
// ------------------------------------------------------------

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load once on mount (client only)
  useEffect(() => {
    setSessions(readSessions());
    setIsLoaded(true);
  }, []);

  /** Save the given messages as a session. Returns the saved session id, or null if not saved. */
  const saveSession = useCallback(
    (messages: UIMessage[], mode: ChatMode): string | null => {
      if (!isWorthSaving(messages)) return null;

      const id = makeId();
      const now = Date.now();
      const session: ChatSession = {
        id,
        title: deriveTitle(messages),
        updatedAt: now,
        mode,
        messages,
      };

      setSessions((prev) => {
        const next = [session, ...prev].slice(0, MAX_SESSIONS);
        writeSessions(next);
        return next;
      });

      return id;
    },
    [],
  );

  /** Delete one session by id. */
  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      writeSessions(next);
      return next;
    });
  }, []);

  /** Wipe everything. */
  const clearAll = useCallback(() => {
    setSessions([]);
    writeSessions([]);
  }, []);

  /**
   * Load a session by id. Returns the ChatSession or null.
   * Caller is responsible for setting the messages + mode in state.
   */
  const getSession = useCallback(
    (id: string): ChatSession | null => {
      return sessions.find((s) => s.id === id) ?? null;
    },
    [sessions],
  );

  return {
    sessions,
    isLoaded,
    saveSession,
    deleteSession,
    clearAll,
    getSession,
  };
}
