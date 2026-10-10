import { getKnowledgeCollection } from "./mongodb";

export type RecentCommit = {
  source: string;
  text: string;
};

/**
 * Fetch the most recent commit chunks from the knowledge base,
 * sorted by ingestedAt descending. Optional source filter.
 */
export async function getRecentCommits(options: {
  source?: string;
  limit?: number;
}): Promise<RecentCommit[]> {
  const collection = await getKnowledgeCollection();
  const { source, limit = 10 } = options;

  const query: Record<string, unknown> = {
    source: source ? { $eq: source } : { $regex: "^github:" },
  };

  const docs = await collection
    .find(query)
    .sort({ ingestedAt: -1 })
    .limit(limit)
    .project({ _id: 0, source: 1, text: 1 })
    .toArray();

  return docs.map((d) => ({
    source: String(d.source ?? ""),
    text: String(d.text ?? ""),
  }));
}
