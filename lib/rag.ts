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

// ------------------------------------------------------------
// Retrieval
// ------------------------------------------------------------

export type RetrievedChunk = {
  text: string;
  source: string;
  score: number;
};

export async function retrieve(
  query: string,
  topK: number = 5,
): Promise<RetrievedChunk[]> {
  if (!query.trim()) return [];

  const queryEmbedding = await embedOne(query);
  const collection = await getKnowledgeCollection();

  const pipeline = [
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: Math.max(topK * 20, 100),
        limit: topK,
      },
    },
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
