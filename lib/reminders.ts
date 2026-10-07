import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";

const REMINDERS_COLLECTION = "reminders";

export type Reminder = {
  _id?: string;
  visitorId: string;
  text: string;
  dueAt: string; // ISO string
  completed: boolean;
  createdAt: string; // ISO string
  completedAt?: string;
};

// ------------------------------------------------------------
// Get the reminders collection
// ------------------------------------------------------------
async function getCollection() {
  const db = await getDb();
  return db.collection(REMINDERS_COLLECTION);
}

// ------------------------------------------------------------
// Create
// ------------------------------------------------------------
export async function createReminder(input: {
  visitorId: string;
  text: string;
  dueAt: string;
}): Promise<Reminder> {
  const collection = await getCollection();
  const now = new Date().toISOString();

  const doc = {
    visitorId: input.visitorId,
    text: input.text.trim(),
    dueAt: input.dueAt,
    completed: false,
    createdAt: now,
  };

  const result = await collection.insertOne(doc);

  return {
    _id: result.insertedId.toString(),
    ...doc,
  };
}

// ------------------------------------------------------------
// List — all non-completed reminders for a visitor
// ------------------------------------------------------------
export async function listReminders(visitorId: string): Promise<Reminder[]> {
  const collection = await getCollection();

  const docs = await collection
    .find({ visitorId, completed: false })
    .sort({ dueAt: 1 })
    .toArray();

  return docs.map((d) => ({
    _id: d._id.toString(),
    visitorId: d.visitorId,
    text: d.text,
    dueAt: d.dueAt,
    completed: d.completed,
    createdAt: d.createdAt,
    completedAt: d.completedAt,
  }));
}

// ------------------------------------------------------------
// Count due reminders (dueAt <= now, not completed)
// ------------------------------------------------------------
export async function countDueReminders(visitorId: string): Promise<number> {
  const collection = await getCollection();
  const now = new Date().toISOString();

  return collection.countDocuments({
    visitorId,
    completed: false,
    dueAt: { $lte: now },
  });
}

// ------------------------------------------------------------
// Complete
// ------------------------------------------------------------
export async function completeReminder(
  visitorId: string,
  id: string,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;

  const collection = await getCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id), visitorId },
    {
      $set: {
        completed: true,
        completedAt: new Date().toISOString(),
      },
    },
  );

  return result.modifiedCount > 0;
}

// ------------------------------------------------------------
// Delete
// ------------------------------------------------------------
export async function deleteReminder(
  visitorId: string,
  id: string,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;

  const collection = await getCollection();
  const result = await collection.deleteOne({
    _id: new ObjectId(id),
    visitorId,
  });

  return result.deletedCount > 0;
}
