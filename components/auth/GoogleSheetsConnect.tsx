'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Loader2,
  ExternalLink,
  Plus,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface GoogleSheetsConnectProps {
  user: User
  userSettings: any
  onConnectionUpdate?: (connected: boolean, sheetId?: string) => void
}

interface GoogleSheet {
  id: string
  name: string
  url: string
  createdTime: string
}

export default function GoogleSheetsConnect({
  user,
  userSettings,
  onConnectionUpdate,
}: GoogleSheetsConnectProps) {
  const [isConnected, setIsConnected] = useState(!!userSettings?.google_access_token)
  const [sheets, setSheets] = useState<GoogleSheet[]>([])
  const [selectedSheetId, setSelectedSheetId] = useState(userSettings?.selected_sheet_id || '')
  const [newSheetName, setNewSheetName] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsConnected(!!userSettings?.google_access_token)
    setSelectedSheetId(userSettings?.selected_sheet_id || '')

    if (userSettings?.google_access_token) {
      loadSheets()
    }
  }, [userSettings])

  const connectGoogleSheets = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/google/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()
      if (data.success && data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl
      } else {
        throw new Error(data.error || 'Failed to initiate Google OAuth')
      }
    } catch (error) {
      console.error('Google OAuth error:', error)
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect to Google Sheets',
        variant: 'destructive',
      })
    }
    setLoading(false)
  }

  const loadSheets = async () => {
    try {
      const response = await fetch('/api/google/sheets', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()
      if (data.success) {
        setSheets(data.sheets || [])
      } else {
        throw new Error(data.error || 'Failed to load sheets')
      }
    } catch (error) {
      console.error('Error loading sheets:', error)
      toast({
        title: 'Error Loading Sheets',
        description: error instanceof Error ? error.message : 'Failed to load Google Sheets',
        variant: 'destructive',
      })
    }
  }

  const createNewSheet = async () => {
    if (!newSheetName.trim()) {
      toast({
        title: 'Sheet Name Required',
        description: 'Please enter a name for the new sheet',
        variant: 'destructive',
      })
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/google/sheets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSheetName,
          userId: user.id,
        }),
      })

      const data = await response.json()
      if (data.success) {
        const newSheet = data.sheet
        setSheets([newSheet, ...sheets])
        setSelectedSheetId(newSheet.id)
        setNewSheetName('')

        toast({
          title: 'Sheet Created! 📊',
          description: `Created "${newSheet.name}" with backup headers`,
        })

        // Auto-save the new sheet selection
        await saveSheetSelection(newSheet.id)
      } else {
        throw new Error(data.error || 'Failed to create sheet')
      }
    } catch (error) {
      console.error('Error creating sheet:', error)
      toast({
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'Failed to create Google Sheet',
        variant: 'destructive',
      })
    }
    setCreating(false)
  }

  const saveSheetSelection = async (sheetId?: string) => {
    const targetSheetId = sheetId || selectedSheetId
    if (!targetSheetId) {
      toast({
        title: 'No Sheet Selected',
        description: 'Please select a Google Sheet for backups',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_sheet_id: targetSheetId,
        }),
      })

      const data = await response.json()
      if (data.success) {
        onConnectionUpdate?.(true, targetSheetId)
        toast({
          title: 'Sheet Selected! ✅',
          description: 'Google Sheet has been configured for backups',
        })
      } else {
        throw new Error(data.error || 'Failed to save sheet selection')
      }
    } catch (error) {
      console.error('Error saving sheet selection:', error)
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save sheet selection',
        variant: 'destructive',
      })
    }
    setSaving(false)
  }

  const disconnect = async () => {
    try {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_access_token: null,
          google_refresh_token: null,
          google_token_expires_at: null,
          selected_sheet_id: null,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setIsConnected(false)
        setSheets([])
        setSelectedSheetId('')
        onConnectionUpdate?.(false)
        toast({
          title: 'Disconnected',
          description: 'Google Sheets connection has been removed',
        })
      } else {
        throw new Error(data.error || 'Failed to disconnect')
      }
    } catch (error) {
      console.error('Error disconnecting Google Sheets:', error)
      toast({
        title: 'Error',
        description: 'Failed to disconnect Google Sheets',
        variant: 'destructive',
      })
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Connect Google Sheets
          </CardTitle>
          <CardDescription>
            Connect your Google account to automatically backup HubSpot data to Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-accent border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">What you'll get:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Automatic backup of HubSpot pages to Google Sheets</li>
              <li>• Real-time sync with formatted data</li>
              <li>• Easy data analysis and reporting</li>
              <li>• Secure OAuth connection</li>
            </ul>
          </div>

          <Button onClick={connectGoogleSheets} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Connect Google Sheets
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            You'll be redirected to Google to authorize access to your Google Sheets
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-medium">Google Sheets Connected</h3>
                <p className="text-sm text-muted-foreground">Ready to backup your HubSpot data</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">Connected</Badge>
              <Button variant="outline" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sheet Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Backup Sheet</CardTitle>
          <CardDescription>
            Choose an existing sheet or create a new one for your HubSpot backups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Sheets */}
          {sheets.length > 0 && (
            <div className="space-y-2">
              <Label>Select Existing Sheet</Label>
              <div className="flex gap-2">
                <Select value={selectedSheetId} onValueChange={setSelectedSheetId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choose a Google Sheet..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sheets.map(sheet => (
                      <SelectItem key={sheet.id} value={sheet.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{sheet.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(sheet.createdTime).toLocaleDateString()}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => saveSheetSelection()} disabled={!selectedSheetId || saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>
          )}

          {/* Create New Sheet */}
          <div className="space-y-2">
            <Label>Or Create New Sheet</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter sheet name (e.g., HubSpot Backup 2024)"
                value={newSheetName}
                onChange={e => setNewSheetName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={createNewSheet} disabled={creating || !newSheetName.trim()}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Current Selection */}
          {selectedSheetId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-800 font-medium">
                  Selected: {sheets.find(s => s.id === selectedSheetId)?.name || selectedSheetId}
                </span>
                {sheets.find(s => s.id === selectedSheetId)?.url && (
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={sheets.find(s => s.id === selectedSheetId)?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* No Sheets Warning */}
          {sheets.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-amber-800">
                  No Google Sheets found. Create a new one to get started.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheet Format Info */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Format</CardTitle>
          <CardDescription>
            How your HubSpot data will be organized in Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="font-medium bg-muted p-2 rounded">Page ID</div>
              <div className="font-medium bg-muted p-2 rounded">Page Name</div>
              <div className="font-medium bg-muted p-2 rounded">URL</div>
              <div className="font-medium bg-muted p-2 rounded">Title</div>
              <div className="bg-popover p-2 rounded text-muted-foreground">12345</div>
              <div className="bg-popover p-2 rounded text-muted-foreground">Home Page</div>
              <div className="bg-popover p-2 rounded text-muted-foreground">example.com</div>
              <div className="bg-popover p-2 rounded text-muted-foreground">Welcome</div>
            </div>
            <p className="text-xs text-gray-500">
              Each backup creates a new row with timestamp, and updates are tracked with version
              history.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
