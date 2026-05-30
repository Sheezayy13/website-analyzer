import { cn } from "@/lib/utils"

function scoreColor(score: number): string {
  if (score >= 80) return "var(--success)"
  if (score >= 60) return "var(--warning)"
  return "var(--destructive)"
}

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  label?: string
  className?: string
}

export function ScoreRing({
  score,
  size = 168,
  strokeWidth = 12,
  label,
  className,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, score))
  const offset = circumference - (clamped / 100) * circumference
  const color = scoreColor(clamped)

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono text-4xl font-semibold tabular-nums"
          style={{ color }}
        >
          {clamped}
        </span>
        {label ? (
          <span className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  )
}
