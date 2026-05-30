import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"
import { extractSignals } from "@/lib/signals"
import {
  type AnalysisReport,
  type CategoryKey,
  CATEGORY_LABELS,
} from "@/lib/types"

const MAX_HTML = 60_000 // chars sent to the model

const reportSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: {
      type: SchemaType.STRING,
      description: "2-3 sentence executive overview of the site's overall health.",
    },
    categories: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          key: {
            type: SchemaType.STRING,
            enum: ["seo", "accessibility", "performance", "security", "design"],
          },
          score: {
            type: SchemaType.INTEGER,
            description: "0 to 100",
          },
          summary: {
            type: SchemaType.STRING,
            description: "One sentence on this category's state.",
          },
        },
        required: ["key", "score", "summary"],
      },
    },
    goodPoints: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
      },
      description: "Up to 5 concrete things the site does well.",
    },
    issues: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category: {
            type: SchemaType.STRING,
            enum: ["seo", "accessibility", "performance", "security", "design"],
          },
          severity: {
            type: SchemaType.STRING,
            enum: ["high", "medium", "low"],
          },
          title: {
            type: SchemaType.STRING,
            description: "Short, specific issue title.",
          },
          description: {
            type: SchemaType.STRING,
            description: "What the problem is and why it matters.",
          },
          recommendation: {
            type: SchemaType.STRING,
            description: "A concrete, actionable fix.",
          },
        },
        required: ["category", "severity", "title", "description", "recommendation"],
      },
    },
  },
  required: ["summary", "categories", "goodPoints", "issues"],
}

function gradeFor(score: number): string {
  if (score >= 90) return "A"
  if (score >= 80) return "B"
  if (score >= 70) return "C"
  if (score >= 60) return "D"
  return "F"
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export interface AnalyzeInput {
  mode: "url" | "html"
  value: string
}

export interface AnalyzeResult {
  ok: boolean
  error?: string
  report?: AnalysisReport
}

export async function analyzeWebsite(
  input: AnalyzeInput,
  apiKey: string,
): Promise<AnalyzeResult> {
  if (!apiKey) {
    return { ok: false, error: "Please configure your Gemini API Key in the settings first." }
  }

  const value = input.value?.trim()
  if (!value) {
    return { ok: false, error: "Please provide a URL or paste some HTML." }
  }

  let html = ""
  let target = value
  let fetchedFromUrl = false
  let resolvedUrl: string | null = null

  try {
    if (input.mode === "url") {
      resolvedUrl = normalizeUrl(value)
      target = resolvedUrl

      // Multiple CORS proxies as fallbacks
      const proxies = [
        (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      ]

      let lastError = ""
      for (const makeProxyUrl of proxies) {
        try {
          const proxyUrl = makeProxyUrl(resolvedUrl)
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 15_000)

          const res = await fetch(proxyUrl, {
            signal: controller.signal,
          }).finally(() => clearTimeout(timeout))

          if (res.ok) {
            html = await res.text()
            fetchedFromUrl = true
            break
          }
          lastError = `HTTP ${res.status}`
        } catch (e: any) {
          lastError = e?.name === "AbortError" ? "timed out" : (e?.message || "failed")
        }
      }

      if (!html) {
        return {
          ok: false,
          error: `Could not fetch the page via any proxy (${lastError}). Try pasting the HTML instead.`,
        }
      }
    } else {
      html = value
      target = "Pasted HTML"
    }
  } catch (err) {
    return {
      ok: false,
      error:
        "Failed to reach that URL. The site may block proxies or be unreachable — try pasting its HTML instead.",
    }
  }

  if (!html || html.length < 30) {
    return { ok: false, error: "There was not enough HTML content to analyze." }
  }

  const signals = extractSignals(html, resolvedUrl)
  const htmlSnippet = html.slice(0, MAX_HTML)

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `You are Sentinel, a senior web auditor. You analyze a single web page across five categories: SEO & metadata, Accessibility, Performance, Security, and Design & layout.

Rules:
- Ground every finding in the provided FACTUAL SIGNALS and HTML. Do not invent issues that aren't supported by evidence.
- Score each category 0-100 (100 = excellent). Be fair but rigorous.
- Severity: "high" = breaks UX/SEO/security or legal a11y risk; "medium" = meaningful but not critical; "low" = minor polish.
- Return between 4 and 12 issues total, ordered by severity (high first). Prefer specific, concrete issues over generic advice.
- Every recommendation must be actionable (mention the tag, attribute, or technique to use).
- If the page is only a fragment of HTML (pasted), do not penalize for missing <html>/<head> wrappers unless clearly relevant.`,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: reportSchema as any,
      },
    })

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Analyze this page.

TARGET: ${target}
SOURCE: ${fetchedFromUrl ? "Live fetched URL" : "Pasted HTML fragment"}

FACTUAL SIGNALS (extracted deterministically):
${JSON.stringify(signals, null, 2)}

HTML (truncated to ${MAX_HTML} chars):
"""
${htmlSnippet}
"""`
            }
          ]
        }
      ]
    })

    const text = result.response.text()
    if (!text) {
      throw new Error("No response text received from Gemini.")
    }

    const ai = JSON.parse(text)

    // Ensure all five categories exist; fill any the model omitted.
    const order: CategoryKey[] = [
      "seo",
      "accessibility",
      "performance",
      "security",
      "design",
    ]
    const byKey = new Map(
      (ai.categories || []).map((c: any) => [c.key, c])
    )
    const categories = order.map((key) => {
      const c = byKey.get(key)
      return {
        key,
        label: CATEGORY_LABELS[key],
        score: c ? Math.round(c.score) : 50,
        summary: c?.summary ?? "Not enough information to fully assess.",
      }
    })

    const overallScore = Math.round(
      categories.reduce((sum, c) => sum + c.score, 0) / categories.length,
    )

    const severityRank = { high: 0, medium: 1, low: 2 }
    const rawIssues = ai.issues || []
    const issues = [...rawIssues]
      .filter((i: any) => i && i.severity && i.category)
      .sort(
        (a, b) =>
          (severityRank[a.severity as keyof typeof severityRank] ?? 1) -
          (severityRank[b.severity as keyof typeof severityRank] ?? 1),
      )

    const report: AnalysisReport = {
      target,
      fetchedFromUrl,
      overallScore,
      grade: gradeFor(overallScore),
      summary: ai.summary || "Analysis completed.",
      categories,
      issues,
      goodPoints: (ai.goodPoints || []).slice(0, 5),
    }

    return { ok: true, report }
  } catch (err: any) {
    console.error("Gemini analysis error:", err)
    const errMsg = err?.message || String(err)
    if (errMsg.includes("API key")) {
      return {
        ok: false,
        error: "Invalid API key or key lacks permission. Please check your Gemini API key in settings.",
      }
    }
    return {
      ok: false,
      error: `Gemini failed to complete analysis: ${errMsg}`,
    }
  }
}
