'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogOut } from 'lucide-react'
import GoogleConnection from './GoogleConnection'
import HubSpotConnection from './HubSpotConnection'
import PageSync from './PageSync'
import SyncHistory from './SyncHistory'
import AutoBackupManager from '../backup/AutoBackupManager'
import ChangeHistory from '../backup/ChangeHistory'
import PageEditor from '../pages/PageEditor'
import { useToast } from '@/hooks/use-toast'

interface EnhancedDashboardProps {
  user: User
}

export default function EnhancedDashboard({ user }: EnhancedDashboardProps) {
  const [googleConnected, setGoogleConnected] = useState(false)
  const [hubspotConnected, setHubspotConnected] = useState(false)
  const [selectedSheetId, setSelectedSheetId] = useState<string>('')
  const [hubspotToken, setHubspotToken] = useState<string>('')
  const [refreshKey, setRefreshKey] = useState(0)
  const { toast } = useToast()

  const supabase = createClient()

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error.message)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      console.log('Signed out successfully')
      window.location.href = '/'
    }
  }

  const refreshHistory = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-popover">
      <header className="bg-background shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HubSpot Backup & Sync Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user.email}</p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Connection Status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>Manage your integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Badge variant={googleConnected ? 'default' : 'secondary'}>
                  Google Sheets: {googleConnected ? 'Connected' : 'Not Connected'}
                </Badge>
                <Badge variant={hubspotConnected ? 'default' : 'secondary'}>
                  HubSpot: {hubspotConnected ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Main Tabs */}
          <Tabs defaultValue="connections" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="connections">Connections</TabsTrigger>
              <TabsTrigger value="backup">Auto Backup</TabsTrigger>
              <TabsTrigger value="sync">Manual Sync</TabsTrigger>
              <TabsTrigger value="editor">Page Editor</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Connections Tab */}
            <TabsContent value="connections" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GoogleConnection
                  onConnectionChange={setGoogleConnected}
                  onSheetSelect={setSelectedSheetId}
                />
                <HubSpotConnection
                  onConnectionChange={setHubspotConnected}
                  onTokenChange={setHubspotToken}
                />
              </div>
            </TabsContent>

            {/* Auto Backup Tab */}
            <TabsContent value="backup" className="space-y-6">
              <AutoBackupManager
                userId={user.id}
                hubspotToken={hubspotToken}
                sheetId={selectedSheetId}
              />
            </TabsContent>

            {/* Manual Sync Tab */}
            <TabsContent value="sync" className="space-y-6">
              {googleConnected && hubspotConnected ? (
                <PageSync
                  userId={user.id}
                  sheetId={selectedSheetId}
                  hubspotToken={hubspotToken}
                  onSyncComplete={refreshHistory}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        Connect both Google Sheets and HubSpot to enable manual sync
                      </p>
                      <Button
                        onClick={() => {
                          const tabsList = document.querySelector('[role="tablist"]')
                          const connectionsTab = tabsList?.querySelector(
                            '[value="connections"]'
                          ) as HTMLElement
                          connectionsTab?.click()
                        }}
                        variant="outline"
                      >
                        Go to Connections
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Page Editor Tab */}
            <TabsContent value="editor" className="space-y-6">
              {hubspotConnected ? (
                <PageEditor
                  userId={user.id}
                  hubspotToken={hubspotToken}
                  sheetId={selectedSheetId}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        Connect HubSpot to enable the page editor
                      </p>
                      <Button
                        onClick={() => {
                          const tabsList = document.querySelector('[role="tablist"]')
                          const connectionsTab = tabsList?.querySelector(
                            '[value="connections"]'
                          ) as HTMLElement
                          connectionsTab?.click()
                        }}
                        variant="outline"
                      >
                        Connect HubSpot
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <ChangeHistory userId={user.id} hubspotToken={hubspotToken} />
                <SyncHistory userId={user.id} refreshKey={refreshKey} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
