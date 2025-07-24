// components/dashboard/reports/ReportsDashboard.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { refreshPageCountsAction } from "@/app/actions/reportActions";
import type { PageCounts } from "@/lib/hubspot/api";

interface ReportsDashboardProps {
  initialData: PageCounts;
  initialLastUpdated: string;
}

export default function ReportsDashboard({ initialData, initialLastUpdated }: ReportsDashboardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  // We use the initial data from the server, but lastUpdated can change on the client.
  const [lastUpdated, setLastUpdated] = useState(initialLastUpdated);

  const handleRefresh = async () => {
    setIsLoading(true);
    const result = await refreshPageCountsAction();
    if (result.success) {
      toast({ title: "Success", description: "Page counts have been refreshed." });
      setLastUpdated(new Date().toLocaleString()); // Update timestamp on client
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const pageCountData = [
    { type: "Landing Pages", count: initialData.landingPages },
    { type: "Website Pages", count: initialData.sitePages },
    { type: "Blog Posts", count: initialData.blogPosts },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between border-b bg-background/50 gap-4">
        <div>
          <CardTitle>Page Counts</CardTitle>
          <CardDescription className="mt-1">A real-time overview of your page assets in HubSpot.</CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last Updated: <span className="font-medium">{lastUpdated}</span>
          </div>
          <Button size="sm" onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Data
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Page Type</TableHead>
              <TableHead className="text-right font-semibold">Total Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageCountData.map((item) => (
              <TableRow key={item.type}>
                <TableCell className="font-medium">{item.type}</TableCell>
                <TableCell className="text-right font-medium">{item.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}