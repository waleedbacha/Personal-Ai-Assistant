import { getDb } from "./mongodb";

const COLLECTION = "weekly_reports";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export type StoredReport = {
  weekStart: string;
  weekEnd: string;
  report: string;
  generatedAt: string;
  dataSizes: {
    commits: number;
    events: number;
    conversations: number;
  };
  generationMs: number;
};

// ------------------------------------------------------------
// Find a cached report if it's still fresh
// ------------------------------------------------------------
export async function getCachedReport(
  weekStartIso: string,
): Promise<StoredReport | null> {
  try {
    const db = await getDb();
    const doc = await db
      .collection(COLLECTION)
      .findOne({ weekStart: weekStartIso });

    if (!doc) return null;

    const generatedAt = new Date(doc.generatedAt as string).getTime();
    if (Date.now() - generatedAt > CACHE_TTL_MS) return null;

    return {
      weekStart: String(doc.weekStart),
      weekEnd: String(doc.weekEnd),
      report: String(doc.report),
      generatedAt: String(doc.generatedAt),
      dataSizes: doc.dataSizes as StoredReport["dataSizes"],
      generationMs: Number(doc.generationMs),
    };
  } catch (err) {
    console.error("[reports] cache lookup failed:", err);
    return null;
  }
}

// ------------------------------------------------------------
// Save a freshly generated report (upsert by weekStart)
// ------------------------------------------------------------
export async function saveReport(entry: StoredReport): Promise<void> {
  try {
    const db = await getDb();
    await db
      .collection(COLLECTION)
      .updateOne(
        { weekStart: entry.weekStart },
        { $set: entry },
        { upsert: true },
      );
  } catch (err) {
    console.error("[reports] save failed:", err);
  }
}

// ------------------------------------------------------------
// Fetch recent reports (for future history feature)
// ------------------------------------------------------------
export async function listRecentReports(limit = 12): Promise<StoredReport[]> {
  try {
    const db = await getDb();
    const docs = await db
      .collection(COLLECTION)
      .find({})
      .sort({ weekStart: -1 })
      .limit(limit)
      .toArray();

    return docs.map((d) => ({
      weekStart: String(d.weekStart),
      weekEnd: String(d.weekEnd),
      report: String(d.report),
      generatedAt: String(d.generatedAt),
      dataSizes: d.dataSizes as StoredReport["dataSizes"],
      generationMs: Number(d.generationMs),
    }));
  } catch (err) {
    console.error("[reports] list failed:", err);
    return [];
  }
}
