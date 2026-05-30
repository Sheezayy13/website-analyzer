import { Activity, Gauge, ShieldCheck, Sparkles } from "lucide-react"
import { Analyzer } from "@/components/analyzer"

const PILLARS = [
  { icon: Gauge, label: "SEO & Metadata" },
  { icon: ShieldCheck, label: "Security" },
  { icon: Activity, label: "Performance" },
  { icon: Sparkles, label: "Accessibility & Design" },
]

export default function Page() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="size-4" />
            </span>
            <span className="font-mono text-sm font-semibold tracking-tight">
              Sentinel
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            AI Website Analyzer
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Powered by AI · 5-point audit
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Find what&apos;s wrong with any website
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Paste a URL or raw HTML and get an instant, scored report covering
            SEO, accessibility, performance, security, and design — with a
            prioritized list of issues and concrete fixes.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {PILLARS.map((p) => (
              <span
                key={p.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground"
              >
                <p.icon className="size-3.5 text-primary" />
                {p.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <Analyzer />
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
          Sentinel analyzes the HTML it can fetch or that you paste. Results are
          AI-generated guidance, not a substitute for full audits.
        </div>
      </footer>
    </main>
  )
}
