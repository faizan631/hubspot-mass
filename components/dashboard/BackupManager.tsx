"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Database,
  Download,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  GitPullRequest,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import GoogleSheetsConnect from "../auth/GoogleSheetsConnect";

interface BackupManagerProps {
  user: User;
  hubspotToken: string;
}

interface BackupSession {
  id: string;
  status: "running" | "completed" | "failed";
  pages_backed_up: number;
  total_pages: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

// Helper to make field names pretty
const fieldDisplayNames: { [key: string]: string } = {
  name: "Name",
  url: "URL",
  html_title: "HTML Title",
  meta_description: "Meta Description",
  slug: "Slug",
  body_content_diff: "Body Content Changes",
};

export default function BackupManager({
  user,
  hubspotToken,
}: BackupManagerProps) {
  const [backupSessions, setBackupSessions] = useState<BackupSession[]>([]);
  const [currentBackup, setCurrentBackup] = useState<BackupSession | null>(
    null
  );
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [selectedSheetId, setSelectedSheetId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [changes, setChanges] = useState<any[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    loadBackupHistory();
    checkGoogleConnection();
  }, []);

  const loadBackupHistory = async () => {
    try {
      const mockSessions: BackupSession[] = [
        {
          id: "1",
          status: "completed",
          pages_backed_up: 25,
          total_pages: 25,
          started_at: new Date(Date.now() - 3600000).toISOString(),
          completed_at: new Date(Date.now() - 3500000).toISOString(),
        },
        {
          id: "2",
          status: "completed",
          pages_backed_up: 23,
          total_pages: 23,
          started_at: new Date(Date.now() - 86400000).toISOString(),
          completed_at: new Date(Date.now() - 86300000).toISOString(),
        },
      ];
      setBackupSessions(mockSessions);
    } catch (error) {
      console.error("Error loading backup history:", error);
    }
    setLoading(false);
  };

  const checkGoogleConnection = async () => {
    try {
      const response = await fetch("/api/user/settings");
      if (!response.ok) return;
      const data = await response.json();
      if (data.success && data.settings) {
        setGoogleConnected(!!data.settings.google_access_token);
        setSelectedSheetId(data.settings.backup_sheet_id || "");
      }
    } catch (error) {
      console.error("Error checking Google connection:", error);
    }
  };

  const startBackup = async () => {
    if (!hubspotToken || !googleConnected || !selectedSheetId) {
      toast({
        title: "Prerequisites Missing",
        description: "Connect HubSpot & Google and select a sheet first.",
        variant: "destructive",
      });
      return;
    }
    setIsBackingUp(true);
    const newBackup: BackupSession = {
      id: `backup-${Date.now()}`,
      status: "running",
      pages_backed_up: 0,
      total_pages: 0,
      started_at: new Date().toISOString(),
    };
    setCurrentBackup(newBackup);
    try {
      const response = await fetch("/api/backup/sync-to-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          hubspotToken,
          sheetId: selectedSheetId,
          sheetName: "HubSpot Content Backup",
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Backup failed");
      const completedBackup: BackupSession = {
        ...newBackup,
        status: "completed",
        pages_backed_up: data.pages_synced || 0,
        total_pages: data.pages_synced || 0,
        completed_at: new Date().toISOString(),
      };
      setCurrentBackup(completedBackup);
      setBackupSessions([completedBackup, ...backupSessions]);
      toast({
        title: "Backup Completed! 🎉",
        description: `Successfully backed up ${data.pages_synced} pages.`,
      });
    } catch (error) {
      const failedBackup: BackupSession = {
        ...newBackup,
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      };
      setCurrentBackup(failedBackup);
      setBackupSessions([failedBackup, ...backupSessions]);
      toast({
        title: "Backup Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
    setIsBackingUp(false);
  };

  const previewChanges = async () => {
    if (!selectedSheetId) {
      toast({
        title: "Configuration Missing",
        description: "A backup sheet must be selected.",
        variant: "destructive",
      });
      return;
    }
    setIsPreviewing(true);
    setChanges([]);
    try {
      const response = await fetch("/api/sync/preview-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          sheetId: selectedSheetId,
          sheetName: "HubSpot Content Backup",
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch changes.");
      }
      setChanges(data.changes);
      toast({
        title: "Preview Complete",
        description:
          data.changes.length > 0
            ? `Found ${data.changes.length} page(s) with changes to review.`
            : "No changes found. Your sheet matches the last backup.",
      });
    } catch (error) {
      toast({
        title: "Error Previewing Changes",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    }
    setIsPreviewing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Database className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (
    status: string
  ): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "completed":
        return "default";
      case "failed":
        return "destructive";
      case "running":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!startTime) return "N/A";
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.round(duration / 60)}m`;
    return `${Math.round(duration / 3600)}h`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <GoogleSheetsConnect
        user={user}
        userSettings={{
          google_access_token: googleConnected,
          backup_sheet_id: selectedSheetId,
        }}
        onConnectionUpdate={(connected, sheetId) => {
          setGoogleConnected(connected);
          if (sheetId) setSelectedSheetId(sheetId);
        }}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Manual Backup
          </CardTitle>
          <CardDescription>
            Create an immediate backup of your HubSpot pages to Google Sheets
            and save a snapshot for version comparison.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentBackup && currentBackup.status === "running" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Backup in progress...
                </span>
              </div>
              <Progress value={50} className="w-full animate-pulse" />
            </div>
          )}
          <Button
            onClick={startBackup}
            disabled={
              isBackingUp ||
              !hubspotToken ||
              !googleConnected ||
              !selectedSheetId
            }
            className="w-full"
            size="lg"
          >
            {isBackingUp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Backing up...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Start Backup
              </>
            )}
          </Button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              {hubspotToken ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span>HubSpot Connected</span>
            </div>
            <div className="flex items-center gap-2">
              {googleConnected && selectedSheetId ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span>Google Sheet Selected</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSheetId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitPullRequest className="h-5 w-5" />
              Sync Changes to HubSpot
            </CardTitle>
            <CardDescription>
              After editing in Google Sheets, preview the changes here before
              syncing them back to HubSpot.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={previewChanges}
              disabled={isPreviewing}
              className="w-full"
            >
              {isPreviewing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Comparing Sheet vs. Backup...
                </>
              ) : (
                "Preview Changes from Google Sheet"
              )}
            </Button>

            {!isPreviewing && changes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Review {changes.length} Change(s)
                </h3>
                {changes.map((change) => (
                  <div
                    key={change.pageId}
                    className="border p-4 rounded-lg space-y-3 bg-slate-50"
                  >
                    <h4 className="font-semibold text-base">
                      {change.name}{" "}
                      <span className="text-xs font-mono text-gray-500">
                        (ID: {change.pageId})
                      </span>
                    </h4>

                    {Object.entries(change.fields).map(
                      ([fieldKey, value]: [string, any]) => (
                        <div key={fieldKey}>
                          <div className="flex items-center gap-2 mb-1">
                            <strong className="text-sm">
                              {fieldDisplayNames[fieldKey] || fieldKey}:
                            </strong>
                            {value.location && (
                              <Badge
                                variant="secondary"
                                className="font-mono text-xs font-normal"
                              >
                                Row {value.location.row}, Col{" "}
                                {value.location.column}
                              </Badge>
                            )}
                          </div>

                          {fieldKey === "body_content_diff" ? (
                            <div
                              className="diff-container border rounded mt-1 p-3 text-sm leading-relaxed bg-white"
                              dangerouslySetInnerHTML={{
                                __html: value.diffHtml,
                              }}
                            />
                          ) : (
                            <div className="text-sm p-2 rounded bg-white mt-1 font-mono">
                              <span className="text-red-600 line-through">
                                {value.old || "(empty)"}
                              </span>
                              <span className="text-gray-400 mx-2">→</span>
                              <span className="text-green-600">
                                {value.new || "(empty)"}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                ))}
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled
                >
                  Confirm and Sync {changes.length} Changes to HubSpot (Coming
                  Soon)
                </Button>
              </div>
            )}

            {!isPreviewing && changes.length === 0 && (
              <p className="text-sm text-center text-gray-500 pt-4">
                Click "Preview Changes" to check for modifications in your
                Google Sheet.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Backup History
          </CardTitle>
          <CardDescription>
            Recent backup sessions and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupSessions.length > 0 ? (
            <div className="space-y-4">
              {backupSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(session.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(session.status)}>
                          {session.status.charAt(0).toUpperCase() +
                            session.status.slice(1)}
                        </Badge>
                        <span className="text-sm font-medium">
                          {session.pages_backed_up}/{session.total_pages} pages
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Started: {new Date(session.started_at).toLocaleString()}
                        {session.completed_at && (
                          <span className="ml-2">
                            • Duration:{" "}
                            {formatDuration(
                              session.started_at,
                              session.completed_at
                            )}
                          </span>
                        )}
                      </div>
                      {session.error_message && (
                        <div className="text-xs text-red-600 mt-1">
                          Error: {session.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                  {session.status === "completed" && selectedSheetId && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${selectedSheetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileSpreadsheet className="h-3 w-3 mr-1" />
                        View Sheet
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Backups Yet
              </h3>
              <p className="text-gray-600">
                Create your first backup to see the history here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
