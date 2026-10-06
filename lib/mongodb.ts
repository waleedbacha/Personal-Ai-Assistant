import { MongoClient, Db, Collection, Document } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "waleed-ai";
const collectionName = process.env.MONGODB_COLLECTION || "knowledge";

if (!uri) {
  throw new Error("MONGODB_URI is not set in environment variables.");
}

// Cache the client across hot reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

export async function getKnowledgeCollection(): Promise<Collection<Document>> {
  const db = await getDb();
  return db.collection(collectionName);
}

export const KNOWLEDGE_COLLECTION = collectionName;
export const VECTOR_INDEX_NAME = "vector_index";
