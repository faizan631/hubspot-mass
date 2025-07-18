// components/dashboard/reports/SnapshotsCard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera } from "lucide-react";
import { StaticBarChart } from "./StaticBarChart"; // Import the chart component

export const SnapshotsCard = () => {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Historical Snapshots</CardTitle>
            <CardDescription className="mt-1">
              Track your content growth over time. Powered by your store
              history.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="border-yellow-400 text-yellow-600"
          >
            Coming Soon
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative rounded-lg border-2 border-dashed border-slate-200">
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm">
            <Camera className="h-10 w-10 text-slate-400" />
            <p className="mt-2 font-medium text-slate-500">
              Graph data is not yet available.
            </p>
          </div>
          <StaticBarChart />
        </div>
      </CardContent>
    </Card>
  );
};
