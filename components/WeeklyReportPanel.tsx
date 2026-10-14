"use client";

import { useEffect, useRef, useState } from "react";
import { Markdown } from "./Markdown";

export function WeeklyReportPanel() {
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    let cancelled = false;

    async function load() {
      try {
        console.log("[weekly-report-panel] Fetching…");
        const res = await fetch("/api/weekly-report", { cache: "no-store" });
        console.log("[weekly-report-panel] Response status:", res.status);

        const data = await res.json();
        console.log(
          "[weekly-report-panel] Data keys:",
          Object.keys(data),
          "report length:",
          data.report?.length ?? 0,
        );

        if (cancelled) return;

        if (!res.ok || !data.ok || typeof data.report !== "string") {
          console.error("[weekly-report-panel] Bad response:", data);
          setError(data.error || "Invalid response from server.");
          setIsLoading(false);
          return;
        }

        setReport(data.report);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("[weekly-report-panel] Fetch error:", err);
        setError("Network error. Try again later.");
        setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-12">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
        </span>
        <p className="text-sm italic text-muted">Generating report…</p>
        <p className="text-xs text-muted/60">This can take a few seconds.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  if (!report) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted">
        No report was returned.
      </p>
    );
  }

  return (
    <div className="markdown-body px-4 py-4 text-sm leading-relaxed text-fg">
      <pre className="whitespace-pre-wrap">{report}</pre>
    </div>
  );
}
