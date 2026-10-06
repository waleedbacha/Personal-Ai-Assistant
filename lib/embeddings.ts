import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

// Separate Google client — used only for embeddings.
// Chat still runs on Groq via lib/ai.ts.
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const EMBEDDING_MODEL = "gemini-embedding-001";

// Gemini's default output is 3072 dimensions, but we force 1536
// so the existing MongoDB Atlas vector index works without changes.
// 1536 is plenty of capacity for a personal-assistant knowledge base.
export const EMBEDDING_DIMENSIONS = 1536;

/**
 * Embed a single string. Used at query time in the chat route.
 */
export async function embedOne(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.textEmbeddingModel(EMBEDDING_MODEL),
    value: text,
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    },
  });
  return embedding;
}

/**
 * Embed many strings at once. Used by the ingestion script.
 * Returns embeddings in the same order as the input array.
 */
export async function embedManyTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const { embeddings } = await embedMany({
    model: google.textEmbeddingModel(EMBEDDING_MODEL),
    values: texts,
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    },
  });
  return embeddings;
}
