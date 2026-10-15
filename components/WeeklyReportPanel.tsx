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

    async function load() {
      try {
        console.log("[weekly-report-panel] Fetching…");
        const res = await fetch("/api/weekly-report", { cache: "no-store" });

        console.log("[weekly-report-panel] status:", res.status);

        if (!res.ok) {
          console.error("[weekly-report-panel] Bad status:", res.status);
          setError(`Server error: ${res.status}`);
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        console.log("[weekly-report-panel] keys:", Object.keys(data));
        console.log(
          "[weekly-report-panel] report length:",
          typeof data.report === "string" ? data.report.length : "NOT A STRING",
        );

        if (!data.ok || typeof data.report !== "string") {
          setError(data.error || "Invalid response.");
          setIsLoading(false);
          return;
        }

        setReport(data.report);
        setIsLoading(false);
      } catch (err) {
        console.error("[weekly-report-panel] Fetch error:", err);
        setError("Network error. Try again later.");
        setIsLoading(false);
      }
    }

    load();
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
      <Markdown>{report}</Markdown>
    </div>
  );
}
