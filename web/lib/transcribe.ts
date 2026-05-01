import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client } from "./r2";
import type { Transcript } from "@/lib/shared";

export async function transcribeWithGroq(r2Key: string): Promise<Transcript> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET is not set");

  const obj = await getR2Client().send(new GetObjectCommand({ Bucket: bucket, Key: r2Key }));
  if (!obj.Body) throw new Error("Empty R2 object");
  const buffer = Buffer.from(await obj.Body.transformToByteArray());

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "video/webm" }), "audio.webm");
  form.append("model", "whisper-large-v3");
  form.append("response_format", "verbose_json");
  form.append("temperature", "0");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Groq returned ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { text: string; language: string; segments?: Array<{ start: number; end: number; text: string }> };

  const segments = (data.segments ?? []).map((s) => ({ start: s.start, end: s.end, text: s.text.trim() }));
  return { segments, fullText: data.text, language: data.language, model: "whisper-large-v3" };
}
