import { getDb } from "./mongodb";

const COLLECTION = "conversations";

export type ConversationLog = {
  visitorId: string;
  question: string;
  answerSummary: string;
  category: string;
  createdAt: string;
};

export async function logConversation(log: ConversationLog) {
  try {
    const db = await getDb();
    await db.collection(COLLECTION).insertOne({
      ...log,
      createdAt: log.createdAt || new Date().toISOString(),
    });
  } catch (err) {
    console.error("[conversations] log failed:", err);
  }
}

export async function getConversationsSince(
  since: Date,
): Promise<ConversationLog[]> {
  const db = await getDb();
  const docs = await db
    .collection(COLLECTION)
    .find({ createdAt: { $gte: since.toISOString() } })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return docs.map((d) => ({
    visitorId: String(d.visitorId ?? ""),
    question: String(d.question ?? ""),
    answerSummary: String(d.answerSummary ?? ""),
    category: String(d.category ?? ""),
    createdAt: String(d.createdAt ?? ""),
  }));
}

export async function cleanupOldConversations(daysToKeep = 30) {
  const cutoff = new Date(
    Date.now() - daysToKeep * 24 * 60 * 60 * 1000,
  ).toISOString();
  const db = await getDb();
  const result = await db
    .collection(COLLECTION)
    .deleteMany({ createdAt: { $lt: cutoff } });
  return result.deletedCount;
}
