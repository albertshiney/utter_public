export type RecordingStatus = "uploading" | "transcribing" | "ready" | "failed";

export interface TranscriptSegment {
  /** Start time in seconds. */
  start: number;
  /** End time in seconds. */
  end: number;
  text: string;
}

export interface Transcript {
  segments: TranscriptSegment[];
  fullText: string;
  language: string;
  model: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string; // ISO-8601
}

export interface Recording {
  id: string; // hex string of ObjectId
  title: string;
  createdAt: string; // ISO-8601
  durationMs: number;
  sizeBytes: number;
  status: RecordingStatus;
  r2Key: string;
  r2Bucket: string;
  mimeType: "video/webm" | "video/mp4";
  transcript: Transcript | null;
  chats: ChatMessage[];
  shareToken: string | null;
  failureReason: string | null;
}

/** Format seconds as HH:MM:SS for display. */
export function formatTime(totalSeconds: number): string {
  const s = Math.floor(totalSeconds);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

/** Parse "HH:MM:SS" or "MM:SS" back to seconds. Returns null on garbage input. */
export function parseTime(s: string): number | null {
  const parts = s.split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  return null;
}
