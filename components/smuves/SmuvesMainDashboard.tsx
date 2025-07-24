'use client'

import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogOut, Crown, Shield, Database, Settings, FileText, BarChart3 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Import components
import ConnectionsManager from './ConnectionsManager'
import BackupManager from './BackupManager'
import PageEditor from './PageEditor'
import AuditLogs from './AuditLogs'
import PremiumFeatures from './PremiumFeatures'

interface SmuvesMainDashboardProps {
  user: User
}

interface UserSettings {
  backup_sheet_id?: string
  selected_fields?: string[]
  is_premium: boolean
  premium_expires_at?: string
  auto_backup_enabled: boolean
}

export default function SmuvesMainDashboard({ user }: SmuvesMainDashboardProps) {
  const [activeTab, setActiveTab] = useState('integrations')
  const [userSettings, setUserSettings] = useState<UserSettings>({
    is_premium: false,
    auto_backup_enabled: true,
  })
  const [connections, setConnections] = useState({
    google: false,
    hubspot: false,
    sheetId: '',
    hubspotToken: '',
  })
  const { toast } = useToast()
  const supabase = createClient()

  const loadUserSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setUserSettings(data)
      } else if (error && error.code !== 'PGRST116') {
        console.error('Error loading user settings:', error)
      }
    } catch (error) {
      console.error('Failed to load user settings:', error)
    }
  }, [supabase, user.id])

  useEffect(() => {
    loadUserSettings()
  }, [loadUserSettings])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      window.location.href = '/'
    }
  }

  const logAuditEvent = async (actionType: string, resourceType: string, details: any) => {
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action_type: actionType,
        resource_type: resourceType,
        details,
      })
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  }

  return (
    <div className="min-h-screen bg-popover">
      {/* Header */}
      <header className="bg-background shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-foreground font-bold text-sm">S</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Smuves</h1>
                  <p className="text-xs text-gray-500">V1 Beta</p>
                </div>
              </div>
              {userSettings.is_premium && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-foreground">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500">
                  {userSettings.is_premium ? 'Premium User' : 'Free Plan'}
                </p>
              </div>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Status Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Status
              </CardTitle>
              <CardDescription>Current connection status and system health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      connections.google ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <span className="text-sm">Google Sheets</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      connections.hubspot ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <span className="text-sm">HubSpot</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      userSettings.backup_sheet_id ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <span className="text-sm">Backup Sheet</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      userSettings.auto_backup_enabled ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                  />
                  <span className="text-sm">Auto Backup</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="connect" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Connect</span>
              </TabsTrigger>
              <TabsTrigger value="fields" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Fields</span>
              </TabsTrigger>
              <TabsTrigger value="backup" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Backup</span>
              </TabsTrigger>
              <TabsTrigger value="pages" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Pages</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Logs</span>
              </TabsTrigger>
              <TabsTrigger value="premium" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                <span className="hidden sm:inline">Premium</span>
              </TabsTrigger>
            </TabsList>

            {/* Connections Tab */}
            <TabsContent value="connect">
              <ConnectionsManager
                user={user}
                onConnectionChange={(type, connected, data) => {
                  setConnections(prev => ({
                    ...prev,
                    [type]: connected,
                    ...(type === 'google' && data ? { sheetId: data.sheetId } : {}),
                    ...(type === 'hubspot' && data ? { hubspotToken: data.token } : {}),
                  }))
                  logAuditEvent('connect', type, { connected, ...data })
                }}
                userSettings={userSettings}
                onSettingsUpdate={setUserSettings}
              />
            </TabsContent>

            {/* Field Configuration Tab */}
            {/* <TabsContent value="fields">
              <FieldSelector
                user={user}
                onChange={(fields: any) => {
                  setUserSettings(prev => ({
                    ...prev,
                    selected_fields: fields,
                  }))
                  logAuditEvent('configure', 'fields', {
                    selected_fields: fields,
                  })
                }}
                selectedFields={userSettings.selected_fields || []}
              />
            </TabsContent> */}

            {/* Backup Management Tab */}
            <TabsContent value="backup">
              <BackupManager
                user={user}
                connections={connections}
                userSettings={userSettings}
                onBackupComplete={details => {
                  logAuditEvent('backup', 'pages', details)
                  toast({
                    title: 'Backup Complete',
                    description: `Successfully backed up ${details.pages_count} pages`,
                  })
                }}
              />
            </TabsContent>

            {/* Page Editor Tab */}
            <TabsContent value="pages">
              <PageEditor
                user={user}
                connections={connections}
                userSettings={userSettings}
                onPageUpdate={(pageId, changes) => {
                  logAuditEvent('edit', 'page', { page_id: pageId, changes })
                }}
              />
            </TabsContent>

            {/* Audit Logs Tab */}
            <TabsContent value="logs">
              <AuditLogs
                user={user}
                onExport={format => {
                  logAuditEvent('export', 'logs', { format })
                }}
              />
            </TabsContent>

            {/* Premium Features Tab */}
            <TabsContent value="premium">
              <PremiumFeatures
                user={user}
                userSettings={userSettings}
                onUpgrade={() => {
                  logAuditEvent('upgrade', 'premium', {})
                  loadUserSettings()
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
