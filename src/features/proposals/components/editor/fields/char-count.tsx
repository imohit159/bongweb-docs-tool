import { cn } from "@/lib/utils";

/** "245 / 300", shown only once the text is close to its limit. */
export function CharCount({ value, max, className }: { value: string; max?: number; className?: string }) {
  if (!max || value.length < max * 0.8) return null;
  return (
    <span
      aria-live="polite"
      className={cn(
        "text-xs tabular-nums",
        value.length >= max ? "text-destructive" : "text-muted-foreground",
        className,
      )}
    >
      {value.length} / {max}
    </span>
  );
}
