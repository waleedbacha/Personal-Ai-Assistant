import { getKnowledgeCollection, VECTOR_INDEX_NAME } from "./mongodb";
import { embedOne, embedManyTexts } from "./embeddings";

// ------------------------------------------------------------
// Chunking
// ------------------------------------------------------------

const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_OVERLAP = 100;

export type Chunk = {
  text: string;
  source: string;
  chunkIndex: number;
};

export function chunkText(
  text: string,
  source: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_OVERLAP,
): Chunk[] {
  const cleaned = text.trim();
  if (!cleaned) return [];

  if (cleaned.length <= chunkSize) {
    return [{ text: cleaned, source, chunkIndex: 0 }];
  }

  const chunks: Chunk[] = [];
  let start = 0;
  let index = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length);

    if (end < cleaned.length) {
      const slice = cleaned.slice(start, end);
      const paragraphBreak = slice.lastIndexOf("\n\n");
      const sentenceBreak = slice.lastIndexOf(". ");
      const wordBreak = slice.lastIndexOf(" ");

      if (paragraphBreak > chunkSize * 0.5) {
        end = start + paragraphBreak + 2;
      } else if (sentenceBreak > chunkSize * 0.5) {
        end = start + sentenceBreak + 2;
      } else if (wordBreak > 0) {
        end = start + wordBreak + 1;
      }
    }

    const chunkText = cleaned.slice(start, end).trim();
    if (chunkText) {
      chunks.push({ text: chunkText, source, chunkIndex: index });
      index++;
    }

    start = Math.max(end - overlap, end);
    if (start >= cleaned.length) break;
  }

  return chunks;
}

// ------------------------------------------------------------
// Ingestion types
// ------------------------------------------------------------

export type IngestDocument = {
  text: string;
  source: string;
};

// ------------------------------------------------------------
// ingestDocuments — REPLACES existing chunks for the same source
// Use for persona, CV, project writeups (fixed content).
// ------------------------------------------------------------

export async function ingestDocuments(
  documents: IngestDocument[],
): Promise<number> {
  const collection = await getKnowledgeCollection();

  const allChunks: Chunk[] = [];
  for (const doc of documents) {
    const chunks = chunkText(doc.text, doc.source);
    allChunks.push(...chunks);
  }

  if (allChunks.length === 0) return 0;

  console.log(
    `[rag] Chunked ${documents.length} docs into ${allChunks.length} chunks`,
  );

  const BATCH_SIZE = 20;
  const embeddings: number[][] = [];

  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const batchEmbeddings = await embedManyTexts(batch.map((c) => c.text));
    embeddings.push(...batchEmbeddings);
    console.log(`[rag] Embedded ${embeddings.length}/${allChunks.length}`);
  }

  const sources = [...new Set(allChunks.map((c) => c.source))];
  await collection.deleteMany({ source: { $in: sources } });

  const docs = allChunks.map((chunk, i) => ({
    text: chunk.text,
    source: chunk.source,
    chunkIndex: chunk.chunkIndex,
    embedding: embeddings[i],
  }));

  await collection.insertMany(docs);
  console.log(`[rag] Inserted ${docs.length} chunks into MongoDB`);

  return docs.length;
}

// ------------------------------------------------------------
// appendDocuments — ADDS chunks without deleting existing ones
// Use for GitHub webhooks so commit history accumulates.
// ------------------------------------------------------------

export async function appendDocuments(
  documents: IngestDocument[],
): Promise<number> {
  const collection = await getKnowledgeCollection();

  const allChunks: Chunk[] = [];
  for (const doc of documents) {
    const chunks = chunkText(doc.text, doc.source);
    allChunks.push(...chunks);
  }

  if (allChunks.length === 0) return 0;

  const BATCH_SIZE = 20;
  const embeddings: number[][] = [];

  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const batchEmbeddings = await embedManyTexts(batch.map((c) => c.text));
    embeddings.push(...batchEmbeddings);
  }

  const docs = allChunks.map((chunk, i) => ({
    text: chunk.text,
    source: chunk.source,
    chunkIndex: chunk.chunkIndex,
    embedding: embeddings[i],
    ingestedAt: new Date().toISOString(),
  }));

  await collection.insertMany(docs);
  console.log(`[rag] Appended ${docs.length} chunks to MongoDB`);

  return docs.length;
}

// ------------------------------------------------------------
// clearKnowledge
// ------------------------------------------------------------

export async function clearKnowledge(): Promise<void> {
  const collection = await getKnowledgeCollection();
  await collection.deleteMany({});
}

/**
 * Like appendDocuments, but skips chunks whose `dedupeKey` already exists
 * in the collection for the same source. Use this for webhook-driven
 * ingestion (calendar, GitHub) to avoid duplicates.
 */
export async function appendDocumentsDeduped(
  documents: Array<IngestDocument & { dedupeKey: string }>,
): Promise<{ inserted: number; skipped: number }> {
  const collection = await getKnowledgeCollection();

  if (documents.length === 0) return { inserted: 0, skipped: 0 };

  // 1. Group documents by source — different sources have different dedupeKey namespaces
  const bySource = new Map<
    string,
    Array<IngestDocument & { dedupeKey: string }>
  >();

  for (const doc of documents) {
    const list = bySource.get(doc.source) ?? [];
    list.push(doc);
    bySource.set(doc.source, list);
  }

  // 2. For each source, query existing dedupeKeys in one round trip
  const toIngest: IngestDocument[] = [];
  let skippedCount = 0;

  for (const [source, docs] of bySource) {
    const keys = docs.map((d) => d.dedupeKey);

    const existing = await collection
      .find({ source, dedupeKey: { $in: keys } })
      .project({ dedupeKey: 1 })
      .toArray();

    const existingSet = new Set(existing.map((d) => d.dedupeKey as string));

    for (const doc of docs) {
      if (existingSet.has(doc.dedupeKey)) {
        skippedCount++;
        continue;
      }
      toIngest.push({ text: doc.text, source: doc.source });
    }
  }

  if (toIngest.length === 0) {
    console.log(
      `[rag] All ${documents.length} docs already ingested — nothing to embed`,
    );
    return { inserted: 0, skipped: skippedCount };
  }

  // 3. Chunk + embed only the new documents
  const allChunks: Array<Chunk & { dedupeKey: string }> = [];

  for (const doc of toIngest) {
    // Find the original dedupeKey for this text/source pair
    const original = documents.find(
      (d) => d.text === doc.text && d.source === doc.source,
    );
    const key = original?.dedupeKey ?? "";

    const chunks = chunkText(doc.text, doc.source);
    for (const c of chunks) {
      allChunks.push({
        ...c,
        dedupeKey: `${key}:chunk-${c.chunkIndex}`,
      });
    }
  }

  const BATCH_SIZE = 20;
  const embeddings: number[][] = [];

  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const batchEmbeddings = await embedManyTexts(batch.map((c) => c.text));
    embeddings.push(...batchEmbeddings);

    if (i + BATCH_SIZE < allChunks.length) {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  // 4. Insert with dedupeKey so the next run can skip them
  const docs = allChunks.map((chunk, i) => ({
    text: chunk.text,
    source: chunk.source,
    chunkIndex: chunk.chunkIndex,
    embedding: embeddings[i],
    dedupeKey: chunk.dedupeKey,
    ingestedAt: new Date().toISOString(),
  }));

  await collection.insertMany(docs);
  console.log(
    `[rag] Deduped ingest: inserted ${docs.length} chunks, skipped ${skippedCount} existing docs`,
  );

  return { inserted: docs.length, skipped: skippedCount };
}

// ------------------------------------------------------------
// Retrieval
// ------------------------------------------------------------

export type RetrievedChunk = {
  text: string;
  source: string;
  score: number;
};

export type RetrieveFilter = {
  source?: string;
  githubRepos?: string[];
};

export async function retrieve(
  query: string,
  topK: number = 5,
  filter?: RetrieveFilter,
): Promise<RetrievedChunk[]> {
  if (!query.trim()) return [];

  const queryEmbedding = await embedOne(query);
  const collection = await getKnowledgeCollection();

  let atlasFilter: Record<string, unknown> | undefined;

  if (filter?.source) {
    atlasFilter = { source: { $eq: filter.source } };
  } else if (filter?.githubRepos && filter.githubRepos.length > 0) {
    atlasFilter = { source: { $in: filter.githubRepos } };
  }

  const vectorSearchStage: Record<string, unknown> = {
    index: VECTOR_INDEX_NAME,
    path: "embedding",
    queryVector: queryEmbedding,
    numCandidates: Math.max(topK * 20, 100),
    limit: topK,
  };

  if (atlasFilter) {
    vectorSearchStage.filter = atlasFilter;
  }

  const pipeline = [
    { $vectorSearch: vectorSearchStage },
    {
      $project: {
        _id: 0,
        text: 1,
        source: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ];

  const results = await collection.aggregate(pipeline).toArray();

  return results.map((r) => ({
    text: String(r.text ?? ""),
    source: String(r.source ?? ""),
    score: Number(r.score ?? 0),
  }));
}
