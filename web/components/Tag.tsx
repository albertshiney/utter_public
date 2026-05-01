import type { RecordingStatus } from "@/lib/shared";

const STYLES: Record<RecordingStatus | "shared", { color: string; border: string; bg: string; label: string; pulse?: boolean }> = {
  ready:        { color: "text-ok",     border: "border-ok/30",     bg: "bg-ok/[0.06]",     label: "Ready" },
  uploading:    { color: "text-warn",   border: "border-warn/30",   bg: "bg-warn/[0.06]",   label: "Uploading", pulse: true },
  transcribing: { color: "text-accent", border: "border-accent/30", bg: "bg-accent/[0.06]", label: "Transcribing", pulse: true },
  failed:       { color: "text-rec",    border: "border-rec/30",    bg: "bg-rec/[0.06]",    label: "Failed" },
  shared:       { color: "text-accent", border: "border-accent/30", bg: "bg-accent/[0.06]", label: "Shared" },
};

export function Tag({ kind, label }: { kind: keyof typeof STYLES; label?: string }) {
  const s = STYLES[kind];
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider px-2 py-[3px] rounded-full border ${s.color} ${s.border} ${s.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${s.pulse ? "animate-[blink_1.4s_ease-in-out_infinite]" : ""}`} />
      {label ?? s.label}
    </span>
  );
}
