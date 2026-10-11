import { z } from "zod";
import { tool } from "ai";
import { getRecentCommits } from "./commits";

export const getRecentCommitsTool = tool({
  description:
    "Get the most recent GitHub commits for Waleed. Use this when the " +
    "visitor asks about the latest commit, recent commits, what was " +
    "committed recently, or anything about the newest work. " +
    "This returns commits sorted by newest first, across all repos " +
    "unless a specific repo is named.",
  inputSchema: z.object({
    source: z
      .string()
      .optional()
      .describe(
        "Optional repo source string, e.g. 'github:waleedbacha/My-Drone-Force'. " +
          "Only set this if the visitor asked about a specific repo.",
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe("How many recent commits to fetch. Default 5."),
  }),
  execute: async ({ source, limit }) => {
    try {
      const finalLimit = limit ?? 5;

      // Fetch extra to allow for filtering out empty/invalid chunks
      const commits = await getRecentCommits({
        source,
        limit: finalLimit * 2,
      });

      // Compact form — ~40 tokens per commit instead of ~200
      const compact = commits
        .map((c) => {
          const lines = c.text.split("\n");

          const getField = (prefix: string) => {
            const line = lines.find((l) => l.startsWith(prefix));
            return line ? line.slice(prefix.length).trim() : "";
          };

          const messageIdx = lines.findIndex((l) => l.trim() === "Message:");
          const message =
            messageIdx >= 0 && lines[messageIdx + 1]
              ? lines[messageIdx + 1].trim()
              : "";

          return {
            repo: getField("Repository:"),
            sha: getField("Commit:"),
            date: getField("Date:"),
            message,
          };
        })
        .filter((c) => c.sha && c.message)
        .slice(0, finalLimit);

      return {
        ok: true,
        count: compact.length,
        commits: compact,
      };
    } catch (err) {
      console.error("[commit-tool] failed:", err);
      return { ok: false, error: "Could not fetch commits." };
    }
  },
});
