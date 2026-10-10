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
        limit: limit ?? 5,
      });

      return {
        ok: true,
        count: commits.length,
        commits: commits.map((c) => ({
          source: c.source,
          text: c.text,
        })),
      };
    } catch (err) {
      console.error("[commit-tool] failed:", err);
      return { ok: false, error: "Could not fetch commits." };
    }
  },
});
