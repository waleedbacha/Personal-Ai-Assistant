"use client";

import { useState } from "react";
import type { Project } from "@/lib/projects";

type Props = {
  project: Project;
  onAsk: (text: string) => void;
};

// ------------------------------------------------------------
// Monogram fallback — first letters of each significant word
// "My Drone Force" → "MD", "ShopIT" → "SI"
// ------------------------------------------------------------

function monogram(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    // Camel-case aware: ShopIT → S + I
    const caps = words[0].match(/[A-Z]/g);
    if (caps && caps.length >= 2) {
      return (caps[0] + caps[1]).toUpperCase();
    }
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function ProjectCard({ project, onAsk }: Props) {
  const [showFeatures, setShowFeatures] = useState(false);
  const hasFeatures = Boolean(project.features?.length);

  return (
    <article className="flex w-[78vw] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-bg-soft/70 shadow-sm transition-shadow duration-300 hover:shadow-lg sm:w-[320px]">
      {/* ---------- Preview ---------- */}
      <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-accent/15 via-bg-soft to-bg sm:h-36">
        {/* project.screenshot is not in the type yet, but if you add it
            to a persona project object this will pick it up. */}
        {(project as any).screenshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={(project as any).screenshot}
            alt={project.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-serif text-4xl font-semibold tracking-wide text-accent/80 sm:text-5xl">
              {monogram(project.name)}
            </span>
          </div>
        )}

        {/* Category pill */}
        <span className="absolute left-3 top-3 rounded-full border border-border/80 bg-bg/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-muted backdrop-blur-sm">
          {project.category}
        </span>
      </div>

      {/* ---------- Body ---------- */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-serif text-base font-semibold leading-tight text-fg sm:text-lg">
            {project.name}
          </h3>
          <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted sm:text-sm">
            {project.description}
          </p>
        </div>

        {/* Status */}
        {project.status && (
          <p className="flex items-center gap-1.5 text-[11px] text-muted sm:text-xs">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            {project.status}
          </p>
        )}

        {/* Stack */}
        {project.stack && project.stack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.stack.slice(0, 5).map((tech) => (
              <span
                key={tech}
                className="rounded-md bg-bg px-2 py-0.5 text-[10px] font-medium text-muted/90 ring-1 ring-border/70 sm:text-[11px]"
              >
                {tech}
              </span>
            ))}
            {project.stack.length > 5 && (
              <span className="rounded-md bg-bg px-2 py-0.5 text-[10px] text-muted/70 sm:text-[11px]">
                +{project.stack.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Features (expandable) */}
        {hasFeatures && showFeatures && (
          <ul className="animate-fade-in space-y-1 rounded-lg border border-border/60 bg-bg/50 p-2.5">
            {project.features!.map((f) => (
              <li
                key={f}
                className="flex gap-1.5 text-[11px] leading-relaxed text-muted sm:text-xs"
              >
                <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}

        {/* ---------- Actions ---------- */}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-[11px] font-medium text-bg transition-all duration-300 hover:bg-accent-hover hover:shadow-[0_0_16px_rgba(201,169,97,0.35)] active:scale-95 sm:text-xs"
            >
              Visit site
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17 17 7M7 7h10v10" />
              </svg>
            </a>
          )}

          {hasFeatures && (
            <button
              type="button"
              onClick={() => setShowFeatures((v) => !v)}
              className="rounded-full border border-border bg-bg/50 px-3 py-1.5 text-[11px] font-medium text-muted transition-all duration-300 hover:border-accent/50 hover:text-fg active:scale-95 sm:text-xs"
            >
              {showFeatures ? "Hide features" : "Features"}
            </button>
          )}

          <button
            type="button"
            onClick={() => onAsk(`Tell me more about ${project.name}`)}
            className="rounded-full border border-border bg-bg/50 px-3 py-1.5 text-[11px] font-medium text-muted transition-all duration-300 hover:border-accent/50 hover:text-fg active:scale-95 sm:text-xs"
          >
            Ask about it
          </button>
        </div>
      </div>
    </article>
  );
}
