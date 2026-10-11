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
      .max(20)
      .optional()
      .describe("How many recent commits to fetch. Default 5."),
  }),
  execute: async ({ source, limit }) => {
    try {
      const commits = await getRecentCommits({
        source,
        limit: (limit ?? 5) * 2, // fetch extra to allow for filtering
      });

      const compact = commits
        .map((c) => {
          const lines = c.text.split("\n");
          return {
            repo:
              lines
                .find((l) => l.startsWith("Repository:"))
                ?.replace("Repository: ", "") ?? "",
            sha:
              lines
                .find((l) => l.startsWith("Commit:"))
                ?.replace("Commit: ", "") ?? "",
            date:
              lines.find((l) => l.startsWith("Date:"))?.replace("Date: ", "") ??
              "",
            message:
              lines[
                lines.findIndex((l) => l.trim() === "Message:") + 1
              ]?.trim() ?? "",
          };
        })
        .filter((c) => c.sha && c.message) // drop empty/invalid entries
        .slice(0, limit ?? 5);

      return { ok: true, count: compact.length, commits: compact };
    } catch (err) {
      console.error("[commit-tool] failed:", err);
      return { ok: false, error: "Could not fetch commits." };
    }
  },
});
