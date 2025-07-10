"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Database, Download, Calendar, CheckCircle, AlertCircle, Loader2, FileSpreadsheet } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import GoogleSheetsConnect from "../auth/GoogleSheetsConnect"

interface BackupManagerProps {
  user: User
  hubspotToken: string
}

interface BackupSession {
  id: string
  status: "running" | "completed" | "failed"
  pages_backed_up: number
  total_pages: number
  started_at: string
  completed_at?: string
  error_message?: string
}

export default function BackupManager({ user, hubspotToken }: BackupManagerProps) {
  const [backupSessions, setBackupSessions] = useState<BackupSession[]>([])
  const [currentBackup, setCurrentBackup] = useState<BackupSession | null>(null)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [selectedSheetId, setSelectedSheetId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadBackupHistory()
    checkGoogleConnection()
  }, [])

  const loadBackupHistory = async () => {
    try {
      // Mock backup history for now
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
        {
          id: "3",
          status: "failed",
          pages_backed_up: 5,
          total_pages: 25,
          started_at: new Date(Date.now() - 172800000).toISOString(),
          error_message: "Rate limit exceeded",
        },
      ]
      setBackupSessions(mockSessions)
    } catch (error) {
      console.error("Error loading backup history:", error)
    }
    setLoading(false)
  }

  const checkGoogleConnection = async () => {
    try {
      const response = await fetch("/api/user/settings")
      const data = await response.json()

      if (data.success && data.settings) {
        setGoogleConnected(!!data.settings.google_access_token)
        setSelectedSheetId(data.settings.selected_sheet_id || "")
      }
    } catch (error) {
      console.error("Error checking Google connection:", error)
    }
  }

  const startBackup = async () => {
    if (!hubspotToken) {
      toast({
        title: "HubSpot Not Connected",
        description: "Please connect your HubSpot account first",
        variant: "destructive",
      })
      return
    }

    if (!googleConnected || !selectedSheetId) {
      toast({
        title: "Google Sheets Not Connected",
        description: "Please connect Google Sheets and select a backup sheet",
        variant: "destructive",
      })
      return
    }

    setIsBackingUp(true)
    const newBackup: BackupSession = {
      id: `backup-${Date.now()}`,
      status: "running",
      pages_backed_up: 0,
      total_pages: 0,
      started_at: new Date().toISOString(),
    }
    setCurrentBackup(newBackup)

    try {
      const response = await fetch("/api/backup/sync-to-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          hubspotToken,
          sheetId: selectedSheetId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const completedBackup: BackupSession = {
          ...newBackup,
          status: "completed",
          pages_backed_up: data.pages_synced || 0,
          total_pages: data.total_pages || 0,
          completed_at: new Date().toISOString(),
        }

        setCurrentBackup(completedBackup)
        setBackupSessions([completedBackup, ...backupSessions])

        toast({
          title: "Backup Completed! 🎉",
          description: `Successfully backed up ${data.pages_synced} pages to Google Sheets`,
        })
      } else {
        throw new Error(data.error || "Backup failed")
      }
    } catch (error) {
      const failedBackup: BackupSession = {
        ...newBackup,
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      }

      setCurrentBackup(failedBackup)
      setBackupSessions([failedBackup, ...backupSessions])

      toast({
        title: "Backup Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    }

    setIsBackingUp(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <Database className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "failed":
        return "destructive"
      case "running":
        return "secondary"
      default:
        return "outline"
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = Math.round((end.getTime() - start.getTime()) / 1000)

    if (duration < 60) return `${duration}s`
    if (duration < 3600) return `${Math.round(duration / 60)}m`
    return `${Math.round(duration / 3600)}h`
  }

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
    )
  }

  return (
    <div className="space-y-6">
      {/* Google Sheets Connection */}
      <GoogleSheetsConnect
        user={user}
        userSettings={{ google_access_token: googleConnected, selected_sheet_id: selectedSheetId }}
        onConnectionUpdate={(connected, sheetId) => {
          setGoogleConnected(connected)
          if (sheetId) setSelectedSheetId(sheetId)
        }}
      />

      {/* Backup Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Manual Backup
          </CardTitle>
          <CardDescription>Create an immediate backup of your HubSpot pages to Google Sheets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Backup Progress */}
          {currentBackup && currentBackup.status === "running" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Backup in progress...</span>
                <span className="text-sm text-gray-600">
                  {currentBackup.pages_backed_up}/{currentBackup.total_pages || "?"} pages
                </span>
              </div>
              <Progress
                value={
                  currentBackup.total_pages ? (currentBackup.pages_backed_up / currentBackup.total_pages) * 100 : 0
                }
                className="w-full"
              />
            </div>
          )}

          {/* Backup Button */}
          <Button
            onClick={startBackup}
            disabled={isBackingUp || !hubspotToken || !googleConnected || !selectedSheetId}
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

          {/* Requirements Check */}
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
              {googleConnected ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span>Google Sheets Connected</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Backup History
          </CardTitle>
          <CardDescription>Recent backup sessions and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {backupSessions.length > 0 ? (
            <div className="space-y-4">
              {backupSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(session.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(session.status)}>
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </Badge>
                        <span className="text-sm font-medium">
                          {session.pages_backed_up}/{session.total_pages} pages
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Started: {new Date(session.started_at).toLocaleString()}
                        {session.completed_at && (
                          <span className="ml-2">
                            • Duration: {formatDuration(session.started_at, session.completed_at)}
                          </span>
                        )}
                      </div>
                      {session.error_message && (
                        <div className="text-xs text-red-600 mt-1">Error: {session.error_message}</div>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Backups Yet</h3>
              <p className="text-gray-600">Create your first backup to see the history here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{backupSessions.filter((s) => s.status === "completed").length}</p>
                <p className="text-sm text-gray-600">Successful Backups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{backupSessions.reduce((sum, s) => sum + s.pages_backed_up, 0)}</p>
                <p className="text-sm text-gray-600">Total Pages Backed Up</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {backupSessions.length > 0 ? new Date(backupSessions[0].started_at).toLocaleDateString() : "Never"}
                </p>
                <p className="text-sm text-gray-600">Last Backup</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
