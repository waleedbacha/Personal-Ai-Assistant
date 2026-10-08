// ------------------------------------------------------------
// Converts a GitHub push webhook payload into text documents
// that the RAG pipeline can chunk, embed, and store.
// ------------------------------------------------------------

type GitHubCommit = {
  id: string;
  message: string;
  timestamp?: string;
  url?: string;
  author?: {
    name?: string;
    email?: string;
    username?: string;
  };
  added?: string[];
  removed?: string[];
  modified?: string[];
};

type GitHubPushPayload = {
  ref?: string;
  repository?: {
    full_name?: string;
    html_url?: string;
    description?: string;
    language?: string;
    default_branch?: string;
  };
  pusher?: { name?: string; email?: string };
  commits?: GitHubCommit[];
};

export type GitHubIngestDoc = {
  text: string;
  source: string;
};

// ------------------------------------------------------------
// Format a single commit as a plain-text block
// ------------------------------------------------------------
function formatCommit(commit: GitHubCommit, repoFullName: string): string {
  const lines: string[] = [];

  lines.push(`Repository: ${repoFullName}`);
  lines.push(`Commit: ${commit.id.slice(0, 7)}`);

  if (commit.timestamp) {
    lines.push(`Date: ${commit.timestamp}`);
  }
  if (commit.author?.name) {
    lines.push(`Author: ${commit.author.name}`);
  }
  if (commit.url) {
    lines.push(`URL: ${commit.url}`);
  }

  lines.push("");
  lines.push("Message:");
  lines.push(commit.message.trim());

  // Files changed — helps the model answer "what did he touch?"
  const added = commit.added ?? [];
  const modified = commit.modified ?? [];
  const removed = commit.removed ?? [];
  const totalFiles = added.length + modified.length + removed.length;

  if (totalFiles > 0) {
    lines.push("");
    lines.push(`Files changed (${totalFiles}):`);

    if (added.length > 0) {
      lines.push("Added:");
      for (const f of added.slice(0, 20)) lines.push(`- ${f}`);
      if (added.length > 20) lines.push(`- …and ${added.length - 20} more`);
    }
    if (modified.length > 0) {
      lines.push("Modified:");
      for (const f of modified.slice(0, 20)) lines.push(`- ${f}`);
      if (modified.length > 20)
        lines.push(`- …and ${modified.length - 20} more`);
    }
    if (removed.length > 0) {
      lines.push("Removed:");
      for (const f of removed.slice(0, 20)) lines.push(`- ${f}`);
      if (removed.length > 20) lines.push(`- …and ${removed.length - 20} more`);
    }
  }

  return lines.join("\n");
}

// ------------------------------------------------------------
// Main entry: payload → array of ingest documents
// ------------------------------------------------------------
export function payloadToDocuments(
  payload: GitHubPushPayload,
): GitHubIngestDoc[] {
  const repoFullName = payload.repository?.full_name ?? "unknown/repo";
  const commits = payload.commits ?? [];

  if (commits.length === 0) return [];

  const repoDescription = payload.repository?.description
    ? `\nRepository description: ${payload.repository.description}`
    : "";
  const repoLanguage = payload.repository?.language
    ? `\nPrimary language: ${payload.repository.language}`
    : "";

  const docs: GitHubIngestDoc[] = [];

  // One document per commit — allows precise retrieval
  for (const commit of commits) {
    // Skip merge commits that have no real message
    if (/^Merge (branch|pull request)/i.test(commit.message.trim())) continue;

    docs.push({
      text: formatCommit(commit, repoFullName),
      source: `github:${repoFullName}`,
    });
  }

  // Also add a "repo summary" document so the model knows the repo exists
  if (docs.length > 0) {
    docs.push({
      text:
        `Repository: ${repoFullName}` +
        repoDescription +
        repoLanguage +
        `\nLatest activity: ${new Date().toISOString()}`,
      source: `github:${repoFullName}`,
    });
  }

  return docs;
}
