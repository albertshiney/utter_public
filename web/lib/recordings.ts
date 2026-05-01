import { ObjectId } from "mongodb";
import { customAlphabet } from "nanoid";
import type { ChatMessage, Recording } from "@/lib/shared";
import { getRecordingsCollection, type RecordingDoc } from "./db";

const TOKEN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
const newToken = customAlphabet(TOKEN_ALPHABET, 16);

function toRecording(doc: RecordingDoc & { _id: ObjectId }): Recording {
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    createdAt: doc.createdAt.toISOString(),
    durationMs: doc.durationMs,
    sizeBytes: doc.sizeBytes,
    status: doc.status,
    r2Key: doc.r2Key,
    r2Bucket: doc.r2Bucket,
    mimeType: doc.mimeType,
    transcript: doc.transcript,
    chats: doc.chats.map((c) => ({ role: c.role, content: c.content, createdAt: c.createdAt.toISOString() })),
    shareToken: doc.shareToken,
    failureReason: doc.failureReason,
  };
}

export async function listRecordings(): Promise<Recording[]> {
  const col = await getRecordingsCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).limit(200).toArray();
  return docs.map((d) => toRecording(d as RecordingDoc & { _id: ObjectId }));
}

export async function getRecording(id: string): Promise<Recording | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await getRecordingsCollection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc ? toRecording(doc as RecordingDoc & { _id: ObjectId }) : null;
}

export async function getRecordingByShareToken(token: string): Promise<Recording | null> {
  const col = await getRecordingsCollection();
  const doc = await col.findOne({ shareToken: token });
  return doc ? toRecording(doc as RecordingDoc & { _id: ObjectId }) : null;
}

export async function mintShareToken(id: string): Promise<string> {
  if (!ObjectId.isValid(id)) throw new Error("Invalid id");
  const col = await getRecordingsCollection();
  const token = newToken();
  await col.updateOne({ _id: new ObjectId(id) }, { $set: { shareToken: token } });
  return token;
}

export async function revokeShareToken(id: string): Promise<void> {
  if (!ObjectId.isValid(id)) throw new Error("Invalid id");
  const col = await getRecordingsCollection();
  await col.updateOne({ _id: new ObjectId(id) }, { $set: { shareToken: null } });
}

export async function appendChatTurn(id: string, turn: Omit<ChatMessage, "createdAt">): Promise<void> {
  if (!ObjectId.isValid(id)) throw new Error("Invalid id");
  const col = await getRecordingsCollection();
  await col.updateOne(
    { _id: new ObjectId(id) },
    { $push: { chats: { role: turn.role, content: turn.content, createdAt: new Date() } } }
  );
}
