import { MongoClient, type Db, type Collection } from "mongodb";
import type { Recording } from "@/lib/shared";

type RecordingDoc = Omit<Recording, "id" | "createdAt" | "transcript" | "chats"> & {
  createdAt: Date;
  transcript: Recording["transcript"] extends infer T ? T : never;
  chats: Array<{ role: "user" | "assistant"; content: string; createdAt: Date }>;
};
export type { RecordingDoc };

/** Used when MONGODB_URI has no database in its path (common for Atlas). */
const DEFAULT_DB_NAME = "utter";

let clientPromise: Promise<MongoClient> | null = null;
let dbPromise: Promise<Db> | null = null;

function getClient(): Promise<MongoClient> {
  if (clientPromise) return clientPromise;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  const client = new MongoClient(uri, { maxPoolSize: 10 });
  clientPromise = client.connect();
  return clientPromise;
}

function dbNameFromUri(uri: string | undefined): string {
  if (!uri) return DEFAULT_DB_NAME;
  // Strip protocol, optional credentials, host[:port], then read the path segment.
  // e.g. mongodb+srv://user:pw@cluster.example.net/utter?opt=1 → "utter"
  // e.g. mongodb+srv://user:pw@cluster.example.net/?opt=1     → ""    → fallback
  try {
    // The driver accepts URIs with multiple comma-separated hosts which `URL`
    // can't parse, so handle the path manually.
    const afterScheme = uri.replace(/^mongodb(\+srv)?:\/\//, "");
    const afterHost = afterScheme.split("/").slice(1).join("/");
    const path = afterHost.split("?")[0]!.replace(/\/$/, "");
    return path.length > 0 ? decodeURIComponent(path) : DEFAULT_DB_NAME;
  } catch {
    return DEFAULT_DB_NAME;
  }
}

export async function getDb(): Promise<Db> {
  if (dbPromise) return dbPromise;
  const uri = process.env.MONGODB_URI;
  const name = dbNameFromUri(uri);
  dbPromise = getClient().then((c) => c.db(name));
  return dbPromise;
}

export async function getRecordingsCollection(): Promise<Collection<RecordingDoc>> {
  const db = await getDb();
  return db.collection<RecordingDoc>("recordings");
}

export async function ensureIndexes(): Promise<void> {
  const col = await getRecordingsCollection();
  await col.createIndex({ createdAt: -1 }, { name: "createdAt_-1" });
  await col.createIndex(
    { shareToken: 1 },
    { name: "shareToken_1", unique: true, partialFilterExpression: { shareToken: { $type: "string" } } }
  );
}

/** Reset the cached client and db. Tests only. */
export function _resetForTests(): void {
  clientPromise = null;
  dbPromise = null;
}
