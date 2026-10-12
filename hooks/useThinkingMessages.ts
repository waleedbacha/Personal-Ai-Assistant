"use client";

import { useEffect, useState } from "react";

const PERSONA_MESSAGES = [
  "Searching knowledge base…",
  "Finding the right answer…",
  "Analyzing your question…",
];

const CALENDAR_MESSAGES = [
  "Checking the calendar…",
  "Finding events…",
  "Looking up schedule…",
];

const COMMIT_MESSAGES = [
  "Checking recent commits…",
  "Looking at GitHub activity…",
  "Scanning repository history…",
];

const DEFAULT_MESSAGES = ["Thinking…", "Working on it…", "Almost there…"];

type Options = {
  isLoading: boolean;
  /** Optional hint about what the request is doing */
  hint?: "persona" | "calendar" | "commits" | "generic";
};

export function useThinkingMessages({ isLoading, hint = "generic" }: Options) {
  const [index, setIndex] = useState(0);

  const messages =
    hint === "calendar"
      ? CALENDAR_MESSAGES
      : hint === "commits"
        ? COMMIT_MESSAGES
        : hint === "persona"
          ? PERSONA_MESSAGES
          : DEFAULT_MESSAGES;

  useEffect(() => {
    if (!isLoading) {
      setIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading, messages.length]);

  return messages[index] ?? messages[0];
}
