import { persona } from "@/data/persona";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export type Project = (typeof persona.projects)[number] & {
  id: string;
};

// ------------------------------------------------------------
// ID generation — slugify the project name
// ------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ------------------------------------------------------------
// Build the id'd project list once at module load
// ------------------------------------------------------------

export const projects: Project[] = persona.projects.map((p) => ({
  ...p,
  id: slugify(p.name),
}));

// Fast lookup
const byId = new Map<string, Project>(projects.map((p) => [p.id, p]));

export function getProject(id: string): Project | undefined {
  return byId.get(id);
}

// ------------------------------------------------------------
// All valid IDs (used by buildSystemPrompt + marker parser)
// ------------------------------------------------------------

export const projectIds: string[] = projects.map((p) => p.id);

// ------------------------------------------------------------
// Featured list — order matters, this is what renders
// for [[projects:featured]]
// ------------------------------------------------------------

export const featuredProjectIds: string[] = [
  "my-drone-force",
  "hamama-perfumes",
  "drones-directory",
  "smart-mall-system",
  "shopit",
  "elegance-perfumes",
];

/**
 * Resolve a comma-separated marker payload (or the literal
 * "featured") into real Project objects.
 * Unknown ids are silently dropped so a hallucinated id can
 * never crash the UI.
 */
export function resolveProjects(payload: string): Project[] {
  const trimmed = payload.trim().toLowerCase();

  if (trimmed === "featured" || trimmed === "") {
    return featuredProjectIds
      .map(getProject)
      .filter((p): p is Project => Boolean(p));
  }

  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(getProject)
    .filter((p): p is Project => Boolean(p));
}

/**
 * Human-readable list of projects for the system prompt.
 * One line per project: "id — Name [Category]".
 */
export function projectMenuForPrompt(): string {
  return projects
    .map((p) => `- ${p.id} — ${p.name} [${p.category}]`)
    .join("\n");
}
