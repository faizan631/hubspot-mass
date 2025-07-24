'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogOut, AlertTriangle } from 'lucide-react'
import GoogleConnection from './GoogleConnection'
import FreeTierConnection from '../hubspot/FreeTierConnection'
import FreeTierBackupManager from '../backup/FreeTierBackupManager'
import SyncHistory from './SyncHistory'
import { useToast } from '@/hooks/use-toast'

interface FreeTierDashboardProps {
  user: User
}

export default function FreeTierDashboard({ user }: FreeTierDashboardProps) {
  const [googleConnected, setGoogleConnected] = useState(false)
  const [hubspotConnected, setHubspotConnected] = useState(false)
  const [selectedSheetId, setSelectedSheetId] = useState<string>('')
  const [hubspotToken, setHubspotToken] = useState<string>('')
  const [domain, setDomain] = useState<string>('')
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

  console.log(refreshHistory)
  return (
    <div className="min-h-screen bg-popover">
      <header className="bg-background shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HubSpot Free Tier Backup</h1>
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
          {/* Free Tier Notice */}
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-900">Free Tier Solution</h3>
                  <p className="text-sm text-amber-800 mt-1">
                    Since CMS Pages API requires a paid plan, this system uses:
                  </p>
                  <ul className="text-sm text-amber-800 mt-2 space-y-1">
                    <li>
                      • <strong>Free HubSpot APIs:</strong> Blog posts, contacts, companies, deals,
                      forms
                    </li>
                    <li>
                      • <strong>Website Scraping:</strong> Extract content directly from your
                      website
                    </li>
                    <li>
                      • <strong>Sitemap Parsing:</strong> Discover pages automatically
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>Manage your integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant={googleConnected ? 'default' : 'secondary'}>
                  Google Sheets: {googleConnected ? 'Connected' : 'Not Connected'}
                </Badge>
                <Badge variant={hubspotConnected ? 'default' : 'secondary'}>
                  HubSpot APIs: {hubspotConnected ? 'Connected' : 'Not Connected'}
                </Badge>
                <Badge variant={domain ? 'default' : 'secondary'}>
                  Website: {domain ? domain : 'Not Set'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Main Tabs */}
          <Tabs defaultValue="connections" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="connections">Setup</TabsTrigger>
              <TabsTrigger value="backup">Backup</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Setup Tab */}
            <TabsContent value="connections" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GoogleConnection
                  onConnectionChange={setGoogleConnected}
                  onSheetSelect={setSelectedSheetId}
                />
                <FreeTierConnection
                  onConnectionChange={setHubspotConnected}
                  onTokenChange={setHubspotToken}
                  onDomainChange={setDomain}
                />
              </div>
            </TabsContent>

            {/* Backup Tab */}
            <TabsContent value="backup" className="space-y-6">
              {googleConnected ? (
                <FreeTierBackupManager
                  userId={user.id}
                  hubspotToken={hubspotToken}
                  domain={domain}
                  sheetId={selectedSheetId}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        Connect Google Sheets to enable backup functionality
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
                        Go to Setup
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <SyncHistory userId={user.id} refreshKey={refreshKey} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
