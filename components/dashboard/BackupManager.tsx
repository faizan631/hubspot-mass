// FILE: BackupManager.tsx (This is the final, complete, and correct version)
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Database,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  GitPullRequest,
  UploadCloud,
  History,
  RefreshCcw,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight,
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
  const [googleConnected, setGoogleConnected] = useState(false);
  const [selectedSheetId, setSelectedSheetId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [changes, setChanges] = useState<any[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const [versions, setVersions] = useState<Version[]>([]);
  const [filteredVersions, setFilteredVersions] = useState<Version[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const versionsPerPage = 5;

  useEffect(() => {
    checkGoogleConnection();
    loadVersionHistory();
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = versions;
    if (searchTerm) {
      filtered = filtered.filter((v) =>
        v.version_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (v) => v.type.toLowerCase() === typeFilter.toLowerCase()
      );
    }
    setFilteredVersions(filtered);
    setCurrentPage(1);
  }, [versions, searchTerm, typeFilter]);

  // --- THE ONLY CHANGE IS HERE ---
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
    } finally {
      setIsLoadingVersions(false);
    }
  };
  // --- END OF CHANGE ---

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

  const handleSheetSelection = async (connected: boolean, sheetId?: string) => {
    setGoogleConnected(connected);
    if (sheetId && sheetId !== selectedSheetId) {
      try {
        setSelectedSheetId(sheetId);
        const response = await fetch("/api/user/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, backup_sheet_id: sheetId }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to save selection.");
        }
        toast({
          title: "Sheet Selection Saved",
          description: "Your selection has been updated in the database.",
        });
      } catch (error) {
        toast({
          title: "Error Saving Selection",
          description:
            error instanceof Error
              ? error.message
              : "Could not save the selected sheet.",
          variant: "destructive",
        });
        checkGoogleConnection();
      }
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
    } finally {
      setIsPreviewing(false);
    }
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
      toast({
        title: "Revert Successful",
        description: `A log has been saved.`,
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

  const totalPages = Math.ceil(filteredVersions.length / versionsPerPage);
  const paginatedVersions = filteredVersions.slice(
    (currentPage - 1) * versionsPerPage,
    currentPage * versionsPerPage
  );
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

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
        onConnectionUpdate={handleSheetSelection}
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
            Version History ({filteredVersions.length} entries)
          </CardTitle>
          <CardDescription>
            Search, filter, and revert your live site to a previous version.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by Version ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Backup">Backup</SelectItem>
                <SelectItem value="Sync">Sync</SelectItem>
                <SelectItem value="Revert">Revert</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={loadVersionHistory}
              variant="outline"
              className="w-full md:w-auto"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh History
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Version ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingVersions ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-gray-500 py-4"
                    >
                      Loading history...
                    </TableCell>
                  </TableRow>
                ) : paginatedVersions.length > 0 ? (
                  paginatedVersions.map((version, index) => (
                    <TableRow key={version.version_id}>
                      <TableCell className="font-mono text-xs">
                        {version.version_id}
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
                                  {new Date(
                                    version.created_at
                                  ).toLocaleString()}
                                </span>
                                . This action is irreversible.
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-gray-500 py-8"
                    >
                      No versions found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-end items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
