"use client";
import { useRef, useState } from "react";
import type { Recording } from "@/lib/shared";
import { TranscriptList } from "@/components/TranscriptList";
import { VideoPlayer, type VideoPlayerHandle } from "@/components/VideoPlayer";
import { Logo } from "@/components/Logo";
import { formatDate, formatDuration } from "@/lib/format";

export function Public({ recording, videoUrl }: { recording: Recording; videoUrl: string }) {
  const playerRef = useRef<VideoPlayerHandle | null>(null);
  const [t, setT] = useState(0);
  const segs = recording.transcript?.segments ?? [];

  return (
    <div className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
      <header className="flex items-center gap-2.5 mb-8">
        <Logo />
        <span className="font-display font-semibold text-lg tracking-tighter">Utter</span>
      </header>

      <h1 className="font-display text-3xl font-semibold tracking-tighter mb-2">{recording.title}</h1>
      <div className="flex flex-wrap gap-3.5 font-mono text-[10.5px] uppercase tracking-wider text-text-2 mb-6">
        <span>{formatDate(recording.createdAt)}</span>
        <span className="text-line-2">·</span>
        <span>{formatDuration(recording.durationMs)} duration</span>
      </div>

      <VideoPlayer ref={playerRef} src={videoUrl} onTimeUpdate={setT} />
      <div className="h-5" />
      <TranscriptList segments={segs} currentTime={t} onSeek={(s) => playerRef.current?.seekTo(s)} />

      <footer className="mt-10 pt-6 border-t border-line-1 font-mono text-[10px] uppercase tracking-wider text-text-2 flex justify-between">
        <span>Shared via Utter</span>
        <span>{recording.transcript?.model ?? "—"}</span>
      </footer>
    </div>
  );
}
