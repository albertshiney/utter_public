import { formatTime } from "@/lib/shared";

export function MonoTime({ seconds, className = "" }: { seconds: number; className?: string }) {
  return (
    <span className={`font-mono tabular-nums tracking-wide ${className}`}>{formatTime(seconds)}</span>
  );
}
