"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import type { Recording } from "@/lib/shared";
import { TranscriptList } from "@/components/TranscriptList";
import { VideoPlayer, type VideoPlayerHandle } from "@/components/VideoPlayer";
import { formatDate, formatDuration } from "@/lib/format";
import { ShareControl } from "@/components/ShareControl";
import { ChatPanel } from "@/components/ChatPanel";

export function Detail({ recording, videoUrl }: { recording: Recording; videoUrl: string }) {
  const playerRef = useRef<VideoPlayerHandle | null>(null);
  const [t, setT] = useState(0);
  const segs = recording.transcript?.segments ?? [];

  return (
    <div className="grid grid-cols-[1fr_380px] min-h-screen">
      <div className="border-r border-line-1 px-8 py-7 flex flex-col gap-5">
        <nav className="font-mono text-[10.5px] uppercase tracking-wider text-text-2">
          <Link href="/" className="text-text-1 hover:text-text-0">Recordings</Link>
          <span className="mx-2 text-line-2">/</span>
          <span>{recording.title}</span>
        </nav>
        <header>
          <h1 className="font-display text-3xl font-semibold tracking-tighter mb-2">{recording.title}</h1>
          <div className="flex flex-wrap gap-3.5 font-mono text-[10.5px] uppercase tracking-wider text-text-2">
            <span>{formatDate(recording.createdAt)}</span>
            <span className="text-line-2">·</span>
            <span>{formatDuration(recording.durationMs)} duration</span>
            <span className="text-line-2">·</span>
            <span>{recording.transcript?.model ?? "—"}</span>
            {recording.shareToken && (<>
              <span className="text-line-2">·</span>
              <span className="text-accent">Shared</span>
            </>)}
          </div>
        </header>
        <ShareControl
          recordingId={recording.id}
          initialToken={recording.shareToken}
          baseUrl={typeof window === "undefined" ? "" : window.location.origin}
        />
        <VideoPlayer ref={playerRef} src={videoUrl} onTimeUpdate={setT} />
        <TranscriptList segments={segs} currentTime={t} onSeek={(s) => playerRef.current?.seekTo(s)} />
      </div>
      <ChatPanel
        recordingId={recording.id}
        initialChats={recording.chats}
        onCitationClick={(s) => playerRef.current?.seekTo(s)}
      />
    </div>
  );
}
