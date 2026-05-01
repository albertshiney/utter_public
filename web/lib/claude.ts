import Anthropic from "@anthropic-ai/sdk";
import { formatTime, parseTime, type TranscriptSegment } from "@/lib/shared";

let cached: Anthropic | null = null;
export function getAnthropic(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  cached = new Anthropic({ apiKey });
  return cached;
}

export interface PromptInput {
  title: string;
  segments: TranscriptSegment[];
}

export function buildSystemPrompt({ title, segments }: PromptInput): string {
  const transcriptLines = segments.map((s) => `[${formatTime(s.start)}] ${s.text}`).join("\n");
  return [
    "You are an assistant analyzing a meeting recording. The transcript below has timestamped segments.",
    "When you reference something specific that was said, cite the moment in [HH:MM:SS] form so the user can click to jump there.",
    "Prefer concrete quotes and specifics over vague summaries. Decline to fabricate — if it isn't in the transcript, say so.",
    `\nTITLE: ${title}\n`,
    "TRANSCRIPT:",
    transcriptLines,
  ].join("\n");
}

export type CitationPart =
  | { type: "text"; text: string }
  | { type: "cite"; seconds: number; label: string };

const CITE_RE = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;

export function parseCitations(text: string): CitationPart[] {
  const out: CitationPart[] = [];
  let last = 0;
  for (const m of text.matchAll(CITE_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ type: "text", text: text.slice(last, idx) });
    const label = m[1]!;
    const seconds = parseTime(label);
    if (seconds == null) {
      out.push({ type: "text", text: m[0] });
    } else {
      out.push({ type: "cite", seconds, label });
    }
    last = idx + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out;
}
