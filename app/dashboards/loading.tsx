// app/dashboards/loading.tsx
import { Card, CardHeader, CardContent } from "@/components/ui/card";

// This is a beautiful skeleton loader that mimics your page structure
export default function DashboardLoading() {
  return (
    <div className="w-full space-y-8 animate-pulse">
      {/* Page Header Skeleton */}
      <div>
        <div className="h-8 w-1/3 rounded-lg bg-slate-200"></div>
        <div className="mt-2 h-4 w-1/2 rounded-lg bg-slate-200"></div>
      </div>

      {/* Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-1/4 rounded-lg bg-slate-200"></div>
          <div className="mt-1 h-4 w-2/5 rounded-lg bg-slate-200"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 w-full rounded-lg bg-slate-200"></div>
          <div className="h-10 w-full rounded-lg bg-slate-200"></div>
          <div className="h-10 w-2/3 rounded-lg bg-slate-200"></div>
        </CardContent>
      </Card>

      {/* Another Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-1/4 rounded-lg bg-slate-200"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-20 w-full rounded-lg bg-slate-200"></div>
        </CardContent>
      </Card>
    </div>
  );
}
