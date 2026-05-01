import Link from "next/link";
import type { Recording } from "@/lib/shared";
import { Tag } from "./Tag";
import { formatDate, formatDuration } from "@/lib/format";

const HEAD_CLS = "px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-text-2 bg-black/[0.18]";

export function RecordingsTable({ recordings }: { recordings: Recording[] }) {
  return (
    <div className="border border-line-1 rounded-lg overflow-hidden bg-bg-1">
      <div className="grid grid-cols-[1fr_100px_140px_220px_60px] gap-6 border-b border-line-1">
        <div className={HEAD_CLS}>Recording</div>
        <div className={HEAD_CLS}>Length</div>
        <div className={HEAD_CLS}>Status</div>
        <div className={HEAD_CLS}>Share</div>
        <div className={HEAD_CLS}></div>
      </div>
      {recordings.length === 0 && (
        <div className="px-5 py-10 text-center text-text-2 text-sm">No recordings yet.</div>
      )}
      {recordings.map((r) => (
        <Link key={r.id} href={`/r/${r.id}` as any}
              className="grid grid-cols-[1fr_100px_140px_220px_60px] gap-6 px-5 py-4 items-center border-b border-line-1 last:border-b-0 hover:bg-bg-2 transition-colors">
          <div className="flex items-center gap-3">
            <Thumb />
            <div>
              <div className="text-sm font-medium">{r.title}</div>
              <div className="font-mono text-[10.5px] text-text-2 tracking-wide mt-0.5">{formatDate(r.createdAt)}</div>
            </div>
          </div>
          <div className="font-mono text-xs text-text-1 tabular-nums tracking-wide">
            {formatDuration(r.durationMs)}
          </div>
          <div>{statusTag(r)}</div>
          <div className={`font-mono text-[11.5px] tracking-wide truncate ${r.shareToken ? "text-accent" : "text-text-2"}`}>
            {r.shareToken ? `/share/${r.shareToken}` : "—"}
          </div>
          <div className="text-right font-mono text-xs text-text-1">→</div>
        </Link>
      ))}
    </div>
  );
}

function Thumb() {
  return (
    <div className="w-11 h-7 rounded-sm border border-line-1 bg-gradient-to-br from-bg-3 to-bg-1 relative shrink-0">
      <span className="absolute left-[38%] top-1/2 -translate-y-1/2 border-l-[6px] border-l-text-1 border-y-[4px] border-y-transparent" />
    </div>
  );
}

function statusTag(r: Recording) {
  if (r.status === "ready") return <Tag kind="ready" />;
  if (r.status === "transcribing") return <Tag kind="transcribing" />;
  if (r.status === "failed") return <Tag kind="failed" />;
  return <Tag kind="uploading" />;
}
