export type CategoryKey =
  | "seo"
  | "accessibility"
  | "performance"
  | "security"
  | "design"

export type Severity = "high" | "medium" | "low"

export interface CategoryScore {
  key: CategoryKey
  label: string
  score: number // 0-100
  summary: string
}

export interface Issue {
  category: CategoryKey
  severity: Severity
  title: string
  description: string
  recommendation: string
}

export interface AnalysisReport {
  target: string
  fetchedFromUrl: boolean
  overallScore: number
  grade: string
  summary: string
  categories: CategoryScore[]
  issues: Issue[]
  goodPoints: string[]
}

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  seo: "SEO & Metadata",
  accessibility: "Accessibility",
  performance: "Performance",
  security: "Security",
  design: "Design & Layout",
}
