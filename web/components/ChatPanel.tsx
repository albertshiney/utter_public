"use client";
import { useRef, useState } from "react";
import type { ChatMessage } from "@/lib/shared";
import { parseCitations } from "@/lib/claude";
import { Citation } from "./Citation";
import { Kbd } from "./Kbd";

interface Props {
  recordingId: string;
  initialChats: ChatMessage[];
  onCitationClick: (seconds: number) => void;
}

export function ChatPanel({ recordingId, initialChats, onCitationClick }: Props) {
  const [chats, setChats] = useState<ChatMessage[]>(initialChats);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next: ChatMessage[] = [...chats, { role: "user", content: text, createdAt: new Date().toISOString() }];
    setChats(next);
    setBusy(true);
    setStreaming("");

    const res = await fetch(`/api/recordings/${recordingId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: next.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => null);
      setChats((c) => [...c, { role: "assistant", content: `Error: ${err?.error ?? res.statusText}`, createdAt: new Date().toISOString() }]);
      setBusy(false);
      return;
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let assembled = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const events = buf.split("\n\n");
      buf = events.pop() ?? "";
      for (const ev of events) {
        const line = ev.split("\n").find((l) => l.startsWith("data: "));
        if (!line) continue;
        try {
          const obj = JSON.parse(line.slice(6));
          if (obj.delta) {
            assembled += obj.delta;
            setStreaming((s) => s + obj.delta);
          }
          if (obj.error) {
            assembled = `Error: ${obj.error}`;
            setStreaming(assembled);
          }
        } catch { /* ignore */ }
      }
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }

    setChats((c) => [...c, { role: "assistant", content: assembled, createdAt: new Date().toISOString() }]);
    setStreaming("");
    setBusy(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <aside className="flex flex-col bg-black/[0.16] min-h-screen">
      <header className="px-5 py-4 border-b border-line-1 flex items-center gap-2.5">
        <span
          className="grid place-items-center rounded-[5px] bg-gradient-to-br from-[#DD7A4A] to-[#B85432] font-display font-bold text-[13px] text-white"
          style={{ width: 22, height: 22 }}
        >C</span>
        <h3 className="font-display font-semibold text-base tracking-tight m-0">Ask Claude</h3>
        <span className="ml-auto font-mono text-[9.5px] uppercase tracking-widest text-text-2">opus 4.7</span>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {chats.length === 0 && !streaming && (
          <p className="text-text-2 text-sm">Ask anything about this recording — decisions, action items, exact quotes, follow-ups.</p>
        )}
        {chats.map((m, i) => (m.role === "user" ? <UserBubble key={i} text={m.content} /> : <AssistantBubble key={i} text={m.content} onCite={onCitationClick} />))}
        {streaming && <AssistantBubble text={streaming} onCite={onCitationClick} />}
      </div>

      <div className="border-t border-line-1 px-4 py-4 bg-black/[0.2]">
        <div className="bg-bg-2 border border-line-1 focus-within:border-line-2 rounded-md px-3 py-2.5 flex items-end gap-2.5">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything about this recording…"
            className="flex-1 bg-transparent border-0 outline-none resize-none text-[13.5px] leading-snug min-h-[22px] text-text-0 placeholder:text-text-2 font-sans"
          />
          <button
            type="button"
            onClick={send}
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="w-7 h-7 grid place-items-center rounded bg-accent hover:bg-accent-hover disabled:opacity-50"
          >
            <span className="block w-0 h-0 border-l-[8px] border-l-white border-y-[5px] border-y-transparent ml-0.5" />
          </button>
        </div>
        <div className="flex justify-between mt-2 font-mono text-[9.5px] uppercase tracking-widest text-text-2">
          <span><Kbd>↩</Kbd> to send · <Kbd>⇧↩</Kbd> new line</span>
        </div>
      </div>
    </aside>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="self-end max-w-[85%] bg-accent/[0.12] border border-accent/20 px-3 py-2 rounded-[10px_10px_2px_10px] text-[13.5px]">{text}</div>
  );
}

function AssistantBubble({ text, onCite }: { text: string; onCite: (s: number) => void }) {
  const parts = parseCitations(text);
  return (
    <div className="text-[13.5px] leading-[1.6] whitespace-pre-wrap">
      {parts.map((p, i) =>
        p.type === "text" ? <span key={i}>{p.text}</span> : <Citation key={i} label={p.label} seconds={p.seconds} onClick={onCite} />
      )}
    </div>
  );
}
