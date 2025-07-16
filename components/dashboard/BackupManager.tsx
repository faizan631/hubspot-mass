// FILE: BackupManager.tsx (Complete with Revert Log Link)

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
  UploadCloud,
  History,
  RefreshCcw,
  ExternalLink, // New Icon
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import GoogleSheetsConnect from "../auth/GoogleSheetsConnect";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

const fieldDisplayNames: { [key: string]: string } = {
  name: "Name",
  url: "URL",
  html_title: "HTML Title",
  meta_description: "Meta Description",
  slug: "Slug",
  state: "State",
  body_content: "Body Content",
  body_content_diff: "Body Content Changes",
};

interface Version {
  version_id: string;
  created_at: string;
  type: "Sync" | "Backup" | "Revert";
}

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);
  const [revertingId, setRevertingId] = useState<string | null>(null);

  const loadVersionHistory = async () => {
    setIsLoadingVersions(true);
    try {
      const response = await fetch("/api/history/get-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json();
      if (data.success) {
        setVersions(data.versions);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Failed to load version history.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  useEffect(() => {
    checkGoogleConnection();
    loadVersionHistory();
    setLoading(false);
  }, []);

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
      toast({
        title: "Backup Completed! 🎉",
        description: `Successfully backed up ${data.pages_synced} pages.`,
      });
      await loadVersionHistory();
    } catch (error) {
      toast({
        title: "Backup Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
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

  const syncChangesToHubspot = async () => {
    if (changes.length === 0) return;
    setIsSyncing(true);
    try {
      const response = await fetch("/api/sync/to-hubspot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, hubspotToken, changes }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Syncing failed.");
      }
      toast({
        title: "Sync Complete!",
        description: `✅ ${data.succeeded.length} succeeded, ❌ ${data.failed.length} failed.`,
      });
      if (data.failed.length > 0) {
        console.error("Failed syncs:", data.failed);
      }
      setChanges([]);
      await loadVersionHistory();
    } catch (error) {
      toast({
        title: "Error Syncing Changes",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRevert = async (versionId: string) => {
    setRevertingId(versionId);
    try {
      const response = await fetch("/api/history/revert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, hubspotToken, versionId }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      // THIS IS THE FIX: Display the clickable link from the API response
      toast({
        title: "Revert Successful",
        description: `Successfully reverted site. A log has been saved.`,
        action: data.revertSheetUrl ? (
          <a
            href={data.revertSheetUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Log
            </Button>
          </a>
        ) : undefined,
      });

      await loadVersionHistory();
    } catch (error) {
      toast({
        title: "Revert Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setRevertingId(null);
    }
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
        onConnectionUpdate={(c, s) => {
          setGoogleConnected(c);
          if (s) setSelectedSheetId(s);
        }}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Manual Backup
          </CardTitle>
          <CardDescription>
            Create an initial backup of your HubSpot pages. This creates a new
            version in your history.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                Create New Backup
              </>
            )}
          </Button>
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
              After editing in Google Sheets, preview changes and then sync them
              to HubSpot. This creates a new version.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={previewChanges}
              disabled={isPreviewing || isSyncing || !!revertingId}
              className="w-full"
            >
              {isPreviewing ? "Comparing..." : "Preview Changes from Sheet"}
            </Button>
            {!isPreviewing && changes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Review {changes.length} Page(s) with Changes
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
                      ([fieldKey, value]: [string, any]) => {
                        if (fieldKey === "body_content") return null;
                        return (
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
                        );
                      }
                    )}
                  </div>
                ))}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={isSyncing}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isSyncing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="mr-2 h-4 w-4" />
                          Confirm and Sync {changes.length} Changes
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will sync {changes.length} change(s) directly to
                        HubSpot and create a new version. This action is
                        irreversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={syncChangesToHubspot}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Yes, Sync
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
            {!isPreviewing && changes.length === 0 && (
              <p className="text-sm text-center text-gray-500 pt-4">
                Click "Preview Changes" to check for modifications.
              </p>
            )}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
          <CardDescription>
            A log of all backups and syncs. You can revert your live site to a
            previous version.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingVersions ? (
            <p className="text-center text-gray-500 py-4">Loading history...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Version ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version, index) => (
                  <TableRow key={version.version_id}>
                    <TableCell className="font-mono text-xs">
                      {version.version_id.split("_")[0]}_
                      {version.version_id.split("_")[1]}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          version.type === "Backup"
                            ? "secondary"
                            : version.type === "Sync"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {version.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(version.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!!revertingId}
                          >
                            {revertingId === version.version_id ? (
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            ) : (
                              <RefreshCcw className="h-3 w-3 mr-2" />
                            )}
                            Revert
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Revert to this version?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will revert all pages to their state from{" "}
                              <span className="font-semibold">
                                {new Date(version.created_at).toLocaleString()}
                              </span>
                              . Any changes made since then will be lost. This
                              creates a new 'Revert' version and cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevert(version.version_id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Yes, Revert to this Version
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoadingVersions && versions.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              No version history found. Create a backup or sync a change to
              start.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
