// components/dashboard/reports/ReportsDashboard.tsx
import { ContentCountsCard } from "./ContentCountsCard";
import { SnapshotsCard } from "./SnapshotsCard";

export default function ReportsDashboard() {
    return (
        <div className="w-full space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports</h1>
                <p className="mt-1 text-slate-500">
                    Analyze your content inventory and track changes over time.
                </p>
            </div>

            {/* Render the components */}
            <ContentCountsCard />
            <SnapshotsCard />
        </div>
    );
}