"use client"

import { useState, useTransition, useEffect } from "react"
import { AlertCircle, Code2, Link2, Loader2, Search, Key } from "lucide-react"
import { analyzeWebsite } from "@/app/actions"
import type { AnalysisReport } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReportView } from "@/components/report-view"
import { ReportSkeleton } from "@/components/report-skeleton"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const EXAMPLES = ["vercel.com", "wikipedia.org", "news.ycombinator.com"]

export function Analyzer() {
  const [mode, setMode] = useState<"url" | "html">("url")
  const [url, setUrl] = useState("")
  const [html, setHtml] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [isPending, startTransition] = useTransition()

  const [apiKey, setApiKey] = useState("")
  const [tempKey, setTempKey] = useState("")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isKeyFromEnv, setIsKeyFromEnv] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("GEMINI_API_KEY") || ""
      const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
      if (saved) {
        setApiKey(saved)
        setTempKey(saved)
        setIsKeyFromEnv(false)
      } else if (envKey) {
        setApiKey(envKey)
        setTempKey(envKey)
        setIsKeyFromEnv(true)
      } else {
        setApiKey("")
        setTempKey("")
        setIsKeyFromEnv(false)
      }
    }
  }, [])

  const saveApiKey = (key: string) => {
    const trimmed = key.trim()
    if (typeof window !== "undefined") {
      if (trimmed) {
        localStorage.setItem("GEMINI_API_KEY", trimmed)
        setApiKey(trimmed)
        setIsKeyFromEnv(false)
      } else {
        localStorage.removeItem("GEMINI_API_KEY")
        const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
        setApiKey(envKey)
        setIsKeyFromEnv(!!envKey)
      }
    }
    setIsSettingsOpen(false)
  }

  function run() {
    setError(null)
    const value = mode === "url" ? url : html
    if (!apiKey) {
      setError("Please configure your Gemini API Key in the settings first.")
      setIsSettingsOpen(true)
      return
    }
    if (!value.trim()) {
      setError(
        mode === "url"
          ? "Enter a website URL to analyze."
          : "Paste some HTML to analyze.",
      )
      return
    }
    startTransition(async () => {
      const res = await analyzeWebsite({ mode, value }, apiKey)
      if (!res.ok || !res.report) {
        setError(res.error ?? "Something went wrong.")
        setReport(null)
        return
      }
      setReport(res.report)
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* API Key Banner */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${apiKey ? "bg-success" : "bg-destructive animate-pulse"}`} />
          <span className="text-muted-foreground font-medium">
            {apiKey ? (
              <>
                Gemini API Key configured {isKeyFromEnv ? "via system" : "custom"} <span className="font-mono text-xs opacity-50">({apiKey.slice(0, 4)}...{apiKey.slice(-4)})</span>
              </>
            ) : (
              "Gemini API Key required for analysis"
            )}
          </span>
        </div>
        <Dialog open={isSettingsOpen} onOpenChange={(open) => {
          setIsSettingsOpen(open)
          if (open) setTempKey(apiKey)
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 cursor-pointer">
              <Key className="size-3.5 text-primary" />
              <span>Settings</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>
                Configure your Gemini API key. This key is stored securely in your browser's local storage and used directly to perform analyses.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="api-key" className="text-xs font-semibold">Gemini API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="AIzaSy..."
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  className="font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Get your free API key from the{" "}
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Google AI Studio
                  </a>.
                </p>
              </div>
            </div>
            <DialogFooter className="sm:justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSettingsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => saveApiKey(tempKey)}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <Tabs value={mode} onValueChange={(v) => setMode(v as "url" | "html")}>
          <TabsList className="mb-4">
            <TabsTrigger value="url" className="gap-1.5">
              <Link2 className="size-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="html" className="gap-1.5">
              <Code2 className="size-4" />
              Paste HTML
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="mt-0">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="url"
                inputMode="url"
                placeholder="example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isPending) run()
                }}
                disabled={isPending}
                className="h-11 font-mono"
                aria-label="Website URL"
              />
              <Button
                onClick={run}
                disabled={isPending}
                className="h-11 shrink-0 px-6"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  <>
                    <Search className="size-4" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
            {/* <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Try:</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setUrl(ex)}
                  disabled={isPending}
                  className="rounded-md border border-border bg-secondary/50 px-2 py-0.5 font-mono transition-colors hover:bg-secondary disabled:opacity-50"
                >
                  {ex}
                </button>
              ))}
            </div> */}
          </TabsContent>

          <TabsContent value="html" className="mt-0">
            <Textarea
              placeholder="Paste a page's full HTML here…"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              disabled={isPending}
              className="min-h-40 resize-y font-mono text-xs leading-relaxed"
              aria-label="HTML source"
            />
            <div className="mt-3 flex justify-end">
              <Button
                onClick={run}
                disabled={isPending}
                className="h-11 px-6"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  <>
                    <Search className="size-4" />
                    Analyze HTML
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isPending && <ReportSkeleton />}

      {!isPending && report && <ReportView report={report} />}
    </div>
  )
}

