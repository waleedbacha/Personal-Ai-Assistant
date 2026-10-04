"use client";

import type { Project } from "@/lib/projects";
import { ProjectCard } from "./ProjectCard";

type Props = {
  projects: Project[];
  onAsk: (text: string) => void;
};

export function ProjectCards({ projects, onAsk }: Props) {
  if (!projects.length) return null;

  return (
    <div className="animate-fade-in-up mt-3 -mx-1 sm:mx-0">
      <div
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3 sm:gap-4"
        style={{
          scrollbarWidth: "thin",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} onAsk={onAsk} />
        ))}
        {/* Trailing spacer so the last card isn't glued to the edge */}
        <div className="w-1 shrink-0" aria-hidden="true" />
      </div>
    </div>
  );
}
