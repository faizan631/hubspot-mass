"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Search,
  Download,
  RefreshCw,
  Calendar,
  Activity,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
const goToNextPage = () =>
  setCurrentPage((prev) => Math.min(prev + 1, totalPages));

interface AuditLogsProps {
  user: SupabaseUser;
}

interface AuditLog {
  id: string;
  action_type: string;
  resource_type: string;
  resource_id: string | null;
  details: any;
  created_at: string;
}

export default function AuditLogs({ user }: AuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const { toast } = useToast();

  const supabase = createClient();

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, actionFilter, resourceFilter]);

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error("Error loading audit logs:", error);
      toast({
        title: "Error Loading Logs",
        description: "Failed to load audit logs",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const filterLogs = () => {
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.resource_id &&
            log.resource_id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action_type === actionFilter);
    }

    // Resource filter
    if (resourceFilter !== "all") {
      filtered = filtered.filter((log) => log.resource_type === resourceFilter);
    }

    setFilteredLogs(filtered);
  };

  const exportLogs = () => {
    const csvContent = [
      ["Timestamp", "Action", "Resource Type", "Resource ID", "Details"],
      ...filteredLogs.map((log) => [
        new Date(log.created_at).toLocaleString(),
        log.action_type,
        log.resource_type,
        log.resource_id || "",
        JSON.stringify(log.details),
      ]),
    ]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredLogs.length} audit log entries`,
    });
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "create":
        return "default";
      case "update":
        return "secondary";
      case "delete":
        return "destructive";
      case "connect":
        return "default";
      case "backup":
        return "outline";
      default:
        return "secondary";
    }
  };
  useEffect(() => {
    filterLogs();
    setCurrentPage(1); // reset pagination on filter
  }, [logs, searchTerm, actionFilter, resourceFilter]);
  const logsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  const getActionIcon = (action: string) => {
    switch (action) {
      case "connect":
        return <Activity className="h-3 w-3" />;
      case "backup":
        return <Download className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const uniqueActions = [...new Set(logs.map((log) => log.action_type))];
  const uniqueResources = [...new Set(logs.map((log) => log.resource_type))];

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Logs ({filteredLogs.length} entries)
          </CardTitle>
          <CardDescription>
            Track all activities and changes in your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {uniqueResources.map((resource) => (
                  <SelectItem key={resource} value={resource}>
                    {resource.replace("_", " ").charAt(0).toUpperCase() +
                      resource.replace("_", " ").slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={loadAuditLogs} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={exportLogs}
                variant="outline"
                size="sm"
                disabled={filteredLogs.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      {filteredLogs.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Timestamp
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Action
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Resource
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Resource ID
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="px-4 py-3 text-gray-700">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={getActionBadgeVariant(log.action_type)}
                      className="flex items-center gap-1"
                    >
                      {getActionIcon(log.action_type)}
                      {log.action_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {log.resource_type.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {log.resource_id || "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {log.details && typeof log.details === "object"
                      ? Object.entries(log.details)
                          .map(
                            ([k, v]) =>
                              `${k}: ${
                                typeof v === "string" ? v : JSON.stringify(v)
                              }`
                          )
                          .join(", ")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Audit Logs
              </h3>
              <p className="text-gray-600">
                {logs.length === 0
                  ? "No activities recorded yet"
                  : "No logs match your current filters"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
