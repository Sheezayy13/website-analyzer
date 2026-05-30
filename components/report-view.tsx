import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Gauge,
  Globe,
  Lightbulb,
  ShieldAlert,
  Sparkles,
} from "lucide-react"
import type {
  AnalysisReport,
  CategoryKey,
  Issue,
  Severity,
} from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScoreRing } from "@/components/score-ring"
import { cn } from "@/lib/utils"

const categoryIcon: Record<CategoryKey, typeof Gauge> = {
  seo: Globe,
  accessibility: CheckCircle2,
  performance: Gauge,
  security: ShieldAlert,
  design: Sparkles,
}

function barColor(score: number): string {
  if (score >= 80) return "bg-success"
  if (score >= 60) return "bg-warning"
  return "bg-destructive"
}

const severityStyles: Record<
  Severity,
  { label: string; badge: string; dot: string }
> = {
  high: {
    label: "High",
    badge: "border-destructive/40 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  medium: {
    label: "Medium",
    badge: "border-warning/40 bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  low: {
    label: "Low",
    badge: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
}

export function ReportView({ report }: { report: AnalysisReport }) {
  const counts = report.issues.reduce(
    (acc, i) => {
      acc[i.severity]++
      return acc
    },
    { high: 0, medium: 0, low: 0 } as Record<Severity, number>,
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Overview */}
      <Card className="overflow-hidden border-border bg-card p-0">
        <div className="flex flex-col gap-8 p-6 md:flex-row md:items-center md:p-8">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <ScoreRing score={report.overallScore} label="Overall" />
            <Badge
              variant="outline"
              className="border-border font-mono text-sm"
            >
              Grade {report.grade}
            </Badge>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="size-4 shrink-0" />
              <span className="truncate font-mono">{report.target}</span>
            </div>
            <p className="mt-3 text-pretty leading-relaxed text-foreground">
              {report.summary}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <SummaryStat
                count={counts.high}
                label="High"
                className="text-destructive"
              />
              <SummaryStat
                count={counts.medium}
                label="Medium"
                className="text-warning"
              />
              <SummaryStat
                count={counts.low}
                label="Low"
                className="text-muted-foreground"
              />
              <SummaryStat
                count={report.goodPoints.length}
                label="Strengths"
                className="text-success"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Category scores */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {report.categories.map((c) => {
          const Icon = categoryIcon[c.key]
          return (
            <Card key={c.key} className="gap-3 border-border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-sm font-medium leading-tight text-pretty">
                    {c.label}
                  </span>
                </div>
                <span className="font-mono text-lg font-semibold tabular-nums">
                  {c.score}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", barColor(c.score))}
                  style={{ width: `${c.score}%` }}
                />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {c.summary}
              </p>
            </Card>
          )
        })}
      </div>

      {/* Strengths */}
      {report.goodPoints.length > 0 && (
        <Card className="gap-4 border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-success" />
            <h2 className="text-base font-semibold">What works well</h2>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {report.goodPoints.map((p, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Issues */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-warning" />
          <h2 className="text-base font-semibold">
            Issues &amp; recommendations
          </h2>
          <Badge variant="secondary" className="ml-1 font-mono">
            {report.issues.length}
          </Badge>
        </div>
        {report.issues.length === 0 ? (
          <Card className="border-border bg-card p-6 text-sm text-muted-foreground">
            No notable issues detected. Nice work.
          </Card>
        ) : (
          report.issues.map((issue, i) => (
            <IssueCard key={i} issue={issue} />
          ))
        )}
      </div>
    </div>
  )
}

function SummaryStat({
  count,
  label,
  className,
}: {
  count: number
  label: string
  className?: string
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2.5 py-1">
      <span className={cn("font-mono text-sm font-semibold tabular-nums", className)}>
        {count}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

const labelFor: Record<CategoryKey, string> = {
  seo: "SEO",
  accessibility: "Accessibility",
  performance: "Performance",
  security: "Security",
  design: "Design",
}

function IssueCard({ issue }: { issue: Issue }) {
  const s = severityStyles[issue.severity]
  return (
    <Card className="gap-0 border-border bg-card p-0">
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", s.dot)} />
            <h3 className="text-sm font-semibold leading-snug text-pretty">
              {issue.title}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {labelFor[issue.category]}
            </Badge>
            <Badge variant="outline" className={cn("text-xs", s.badge)}>
              {s.label}
            </Badge>
          </div>
        </div>
        <p className="pl-5 text-sm leading-relaxed text-muted-foreground">
          {issue.description}
        </p>
        <Separator className="my-1" />
        <div className="flex items-start gap-2 pl-5">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-foreground">
            <span className="font-medium">Fix: </span>
            {issue.recommendation}
          </p>
        </div>
      </div>
    </Card>
  )
}
