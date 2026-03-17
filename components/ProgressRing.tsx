import { cn } from "@/lib/utils";

interface Props {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  className?: string;
}

export function ProgressRing({
  pct,
  size = 36,
  stroke = 3,
  color = "stroke-emerald-700",
  trackColor,
  className,
}: Props) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(100, Math.max(0, pct)) / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("rotate-[-90deg]", className)}
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        className={trackColor ?? "stroke-stone-200"}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={cn("transition-all duration-500", color)}
      />
    </svg>
  );
}
