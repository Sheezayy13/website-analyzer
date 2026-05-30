// Deterministic signal extraction from raw HTML.
// These factual signals are fed to the model so it grounds its
// analysis in real evidence rather than guessing.

export interface PageSignals {
  htmlBytes: number
  isHttps: boolean | null
  hasDoctype: boolean
  lang: string | null
  title: string | null
  titleLength: number
  metaDescription: string | null
  metaDescriptionLength: number
  hasViewportMeta: boolean
  hasCharset: boolean
  canonical: string | null
  h1Count: number
  headingOutline: string[]
  imgCount: number
  imgsMissingAlt: number
  hasOpenGraph: boolean
  hasTwitterCard: boolean
  hasStructuredData: boolean
  inlineStyleCount: number
  scriptCount: number
  externalScriptCount: number
  stylesheetCount: number
  hasFavicon: boolean
  formCount: number
  inputsMissingLabel: number
  ariaUsageCount: number
  hasSkipLink: boolean
  hasMixedContent: boolean
  internalLinkCount: number
  externalLinkCount: number
  hasNoscript: boolean
}

function count(html: string, re: RegExp): number {
  const m = html.match(re)
  return m ? m.length : 0
}

function firstGroup(html: string, re: RegExp): string | null {
  const m = html.match(re)
  return m ? m[1].trim() : null
}

export function extractSignals(html: string, url: string | null): PageSignals {
  const lower = html.toLowerCase()

  const title = firstGroup(html, /<title[^>]*>([\s\S]*?)<\/title>/i)
  const metaDescription = firstGroup(
    html,
    /<meta[^>]+name=["']description["'][^>]*content=["']([\s\S]*?)["']/i,
  )

  // headings outline
  const headingOutline: string[] = []
  const headingRe = /<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi
  let hm: RegExpExecArray | null
  while ((hm = headingRe.exec(html)) !== null && headingOutline.length < 25) {
    const text = hm[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
    if (text) headingOutline.push(`${hm[1].toUpperCase()}: ${text.slice(0, 80)}`)
  }

  // images and alt
  const imgTags = html.match(/<img\b[^>]*>/gi) || []
  const imgsMissingAlt = imgTags.filter(
    (t) => !/\balt\s*=/.test(t.toLowerCase()),
  ).length

  // inputs and labels (rough heuristic)
  const inputTags = html.match(/<input\b[^>]*>/gi) || []
  const inputsMissingLabel = inputTags.filter((t) => {
    const lt = t.toLowerCase()
    if (/type\s*=\s*["'](hidden|submit|button|reset)["']/.test(lt)) return false
    return !/aria-label|aria-labelledby|\bid\s*=/.test(lt)
  }).length

  const isHttps = url ? url.toLowerCase().startsWith("https://") : null

  // mixed content: http:// resources on an https page
  let hasMixedContent = false
  if (isHttps) {
    hasMixedContent = /(?:src|href)\s*=\s*["']http:\/\//i.test(html)
  }

  const externalScripts = (html.match(/<script\b[^>]*src=["'][^"']+["'][^>]*>/gi) || [])
    .length
  const links = html.match(/<a\b[^>]*href=["']([^"']+)["']/gi) || []
  let internalLinkCount = 0
  let externalLinkCount = 0
  for (const l of links) {
    const href = (l.match(/href=["']([^"']+)["']/i) || [])[1] || ""
    if (/^https?:\/\//i.test(href)) externalLinkCount++
    else if (href && !href.startsWith("#") && !href.startsWith("javascript:"))
      internalLinkCount++
  }

  return {
    htmlBytes: new TextEncoder().encode(html).length,
    isHttps,
    hasDoctype: /^\s*<!doctype html>/i.test(html.slice(0, 200)),
    lang: firstGroup(html, /<html[^>]*\blang=["']([^"']+)["']/i),
    title,
    titleLength: title ? title.length : 0,
    metaDescription,
    metaDescriptionLength: metaDescription ? metaDescription.length : 0,
    hasViewportMeta: /<meta[^>]+name=["']viewport["']/i.test(html),
    hasCharset: /<meta[^>]+charset=/i.test(html),
    canonical: firstGroup(
      html,
      /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i,
    ),
    h1Count: count(html, /<h1\b[^>]*>/gi),
    headingOutline,
    imgCount: imgTags.length,
    imgsMissingAlt,
    hasOpenGraph: /<meta[^>]+property=["']og:/i.test(html),
    hasTwitterCard: /<meta[^>]+name=["']twitter:/i.test(html),
    hasStructuredData:
      /application\/ld\+json/i.test(html) || /\bitemscope\b/i.test(html),
    inlineStyleCount: count(html, /style\s*=\s*["']/gi),
    scriptCount: count(html, /<script\b/gi),
    externalScriptCount: externalScripts,
    stylesheetCount: count(html, /<link[^>]+rel=["']stylesheet["']/gi),
    hasFavicon: /<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(html),
    formCount: count(html, /<form\b/gi),
    inputsMissingLabel,
    ariaUsageCount: count(lower, /aria-[a-z]+=/gi),
    hasSkipLink: /skip\s*(to\s*)?(main|content)/i.test(html),
    hasMixedContent,
    internalLinkCount,
    externalLinkCount,
    hasNoscript: /<noscript\b/i.test(html),
  }
}
