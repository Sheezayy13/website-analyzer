import { Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="border-border bg-card p-6 md:p-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-center">
          <Skeleton className="size-[168px] shrink-0 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-7 w-16" />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="gap-3 border-border bg-card p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" />
        Auditing the page across SEO, accessibility, performance, security &amp; design…
      </div>
    </div>
  )
}
