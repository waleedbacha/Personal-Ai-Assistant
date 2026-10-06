/**
 * Ingestion script — run with:
 *   npx tsx scripts/ingest.ts
 *
 * Reads source documents, chunks them, embeds via OpenAI,
 * and stores in MongoDB Atlas.
 */

import { resolve } from "path";

// Load .env.local before anything else

import { persona } from "../data/persona";
import {
  ingestDocuments,
  clearKnowledge,
  type IngestDocument,
} from "../lib/rag";

// ------------------------------------------------------------
// Build a flat text representation of the persona
// ------------------------------------------------------------

function personaToText(): string {
  const p = persona;

  const lines: string[] = [];

  lines.push(`# ${p.name}`);
  lines.push(`Preferred name: ${p.preferredName}`);
  lines.push(`Role: ${p.role}`);
  lines.push(`Location: ${p.location.full}`);
  lines.push("");

  lines.push("## About");
  lines.push(p.about);
  lines.push("");

  lines.push("## Education");
  for (const e of p.education) {
    const bits = [e.institution];
    if (e.degree) bits.push(e.degree);
    if (e.level) bits.push(e.level);
    if (e.period) bits.push(e.period);
    if (e.achievement) bits.push(e.achievement);
    if (e.cgpa) bits.push(`CGPA ${e.cgpa}`);
    lines.push(`- ${bits.join(" — ")}`);
  }
  lines.push("");

  lines.push("## Experience");
  for (const e of p.experience) {
    lines.push(`### ${e.role} at ${e.company}`);
    if (e.location) lines.push(`Location: ${e.location}`);
    if (e.period) lines.push(`Period: ${e.period}`);
    if (e.current) lines.push("Current role.");
    lines.push(e.summary);
    if (e.project) {
      lines.push(`Project: ${e.project.name} — ${e.project.description}`);
      lines.push(`Features: ${e.project.features.join(", ")}`);
    }
    lines.push("");
  }

  lines.push("## Technical Skills");
  lines.push(`Frontend: ${p.skills.frontend.join(", ")}`);
  lines.push(`Backend: ${p.skills.backend.join(", ")}`);
  lines.push(`Databases: ${p.skills.database.join(", ")}`);
  lines.push(`Tools: ${p.skills.tools.join(", ")}`);
  lines.push(`Deployment: ${p.skills.deployment.join(", ")}`);
  lines.push("");

  lines.push("## Soft Skills");
  lines.push(p.softSkills.join(", "));
  lines.push("");

  lines.push("## Services");
  for (const s of p.services) lines.push(`- ${s}`);
  lines.push("");

  lines.push("## Projects");
  for (const pr of p.projects) {
    lines.push(`### ${pr.name} [${pr.category}]`);
    lines.push(pr.description);
    if (pr.link) lines.push(`URL: ${pr.link}`);
    if (pr.status) lines.push(`Status: ${pr.status}`);
    if (pr.ownedBy) lines.push(`Owned by: ${pr.ownedBy}`);
    if (pr.features) lines.push(`Features: ${pr.features.join(", ")}`);
    if (pr.stack) lines.push(`Stack: ${pr.stack.join(", ")}`);
    lines.push("");
  }

  lines.push("## Certifications");
  for (const c of p.certifications) {
    const bits = [`${c.name} — ${c.provider} (${c.issued})`];
    if (c.area) bits.push(c.area);
    lines.push(`- ${bits.join(" — ")}`);
  }
  lines.push("");

  lines.push("## Ventures");
  for (const v of p.ventures) {
    lines.push(`### ${v.name} (${v.type})`);
    lines.push(`Status: ${v.status}`);
    lines.push(`URL: ${v.url}`);
    lines.push(`Owned by: ${v.ownedBy}`);
    lines.push(v.description);
    lines.push("");
  }

  lines.push("## Clients");
  for (const c of p.clients) {
    lines.push(`### ${c.name} (${c.country})`);
    lines.push(`Role: ${c.role}`);
    lines.push(`Collaboration: ${c.collaboration.join(", ")}`);
    lines.push(`Organization: ${c.organization}`);
    lines.push("");
  }

  lines.push("## Contact");
  lines.push(`Email: ${p.contact.email}`);
  lines.push(`LinkedIn: ${p.contact.linkedin}`);
  lines.push(`Portfolio: ${p.contact.portfolio}`);

  return lines.join("\n");
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes("--clear");

  console.log("[ingest] Starting ingestion…");

  if (shouldClear) {
    console.log("[ingest] Clearing existing knowledge base…");
    await clearKnowledge();
  }

  const documents: IngestDocument[] = [
    {
      text: personaToText(),
      source: "persona.ts",
    },
  ];

  // When you're ready to add more sources, append them here:
  // documents.push({ text: cvText, source: "cv" });
  // documents.push({ text: caseStudiesText, source: "case-studies" });

  const count = await ingestDocuments(documents);
  console.log(`[ingest] Done. ${count} chunks stored.`);

  process.exit(0);
}

main().catch((err) => {
  console.error("[ingest] Failed:", err);
  process.exit(1);
});
