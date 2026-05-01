"use client";
import { formatTime, type TranscriptSegment } from "@/lib/shared";
import { useEffect, useRef } from "react";

export function TranscriptList({
  segments,
  currentTime,
  onSeek,
  className = "",
}: {
  segments: TranscriptSegment[];
  currentTime: number;
  onSeek: (seconds: number) => void;
  className?: string;
}) {
  const activeIdx = segments.findIndex((s) => currentTime >= s.start && currentTime < s.end);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIdx]);

  return (
    <div className={`border border-line-1 bg-bg-1 rounded-lg flex flex-col h-[320px] overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-line-1 font-mono text-[10.5px] uppercase tracking-wider text-text-2">
        <span>Transcript · {segments.length} segments</span>
      </div>
      <div ref={containerRef} className="overflow-y-auto py-2 flex-1">
        {segments.map((s, i) => {
          const active = i === activeIdx;
          return (
            <button
              type="button"
              key={i}
              data-seg
              data-active={active}
              onClick={() => onSeek(s.start)}
              className={`w-full text-left grid grid-cols-[64px_1fr] gap-4 px-4 py-2 cursor-pointer transition-colors border-l-2 ${
                active
                  ? "bg-gradient-to-r from-accent/[0.12] to-transparent border-accent"
                  : "border-transparent hover:bg-white/[0.02]"
              }`}
            >
              <span className={`font-mono text-[11px] tracking-wide tabular-nums pt-0.5 ${active ? "text-accent" : "text-text-2"}`}>
                {formatTime(s.start)}
              </span>
              <span className={`text-[13.5px] leading-[1.55] ${active ? "text-text-0" : "text-text-1"}`}>{s.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
