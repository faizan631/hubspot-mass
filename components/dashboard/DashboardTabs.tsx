"use client"

import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client" // Use the CLIENT-SIDE Supabase instance
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Crown } from "lucide-react"

import BackupManager from "@/components/dashboard/BackupManager"
import HubSpotConnect from "@/components/hubspot/HubSpotConnect"
import PageManager from "@/components/pages/PageManager"
import FieldConfigurator from "@/components/fields/FieldConfigurator"
import RollbackManager from "@/components/enhanced/RollbackManager"
import AutoBackupScheduler from "@/components/enhanced/AutoBackupScheduler"
import AuditLogs from "@/components/audit/AuditLogs"
import TeamManager from "@/components/team/TeamManager"
import PremiumUpgrade from "@/components/premium/PremiumUpgrade"

// This component no longer receives any props
interface DashboardTabsProps {}

export default function DashboardTabs({}: DashboardTabsProps) {
  const [user, setUser] = useState<User | null>(null)
  const [userSettings, setUserSettings] = useState<any>(null)
  const [fieldConfigs, setFieldConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
        const { data: settingsData } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .single()
        setUserSettings(settingsData)

        const { data: fieldsData } = await supabase
          .from("field_configurations")
          .select("*")
          .eq("user_id", user.id)
          .order("field_name")
        setFieldConfigs(fieldsData || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleConnectionUpdate = (connected: boolean, token?: string, connectionType?: string) => {
    setUserSettings((prev: any) => ({
      ...prev,
      hubspot_token_encrypted: connected ? token : null,
      hubspot_connection_type: connected ? connectionType : null,
    }))
  }

  if (loading) {
    return <div className="p-10 text-center">Loading your dashboard...</div>
  }

  if (!user) {
    return <div className="p-10 text-center text-red-500">Could not authenticate user. Please try logging in again.</div>
  }

  const isPremium = userSettings?.is_premium || false
  const hubspotToken = userSettings?.hubspot_token_encrypted
  const sheetId = userSettings?.backup_sheet_id
  const isHubSpotConnected = !!hubspotToken

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8 lg:grid-cols-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connect">Connect</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="rollback" className="relative">
            Rollback
            {isPremium && <Crown className="h-3 w-3 ml-1 text-yellow-500" />}
          </TabsTrigger>
          <TabsTrigger value="schedule" className="relative">
            Schedule
            {isPremium && <Crown className="h-3 w-3 ml-1 text-yellow-500" />}
          </TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="team" className="hidden lg:block">
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">HubSpot Connection</h3>
              <Badge variant={isHubSpotConnected ? "default" : "secondary"}>
                {isHubSpotConnected ? "Connected" : "Not Connected"}
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                {isHubSpotConnected ? "Ready to sync pages" : "Connect to start backing up"}
              </p>
              {userSettings?.hubspot_connection_type && (
                <p className="text-xs text-gray-500 mt-1">
                  Type: {userSettings.hubspot_connection_type === "paid" ? "Full CMS" : "Free Tier"}
                </p>
              )}
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">Google Sheets</h3>
              <Badge variant={userSettings?.google_refresh_token ? "default" : "secondary"}>
                {userSettings?.google_refresh_token ? "Connected" : "Not Connected"}
              </Badge>
              <p className="text-sm text-gray-600 mt-2">{sheetId ? `Sheet selected` : "No backup sheet selected"}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">Account Plan</h3>
              <Badge variant={isPremium ? "default" : "secondary"} className="flex items-center gap-1 w-fit">
                {isPremium ? ( <><Crown className="h-3 w-3" /> Premium</> ) : ( "Free Plan" )}
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                {isPremium ? "All features unlocked" : "Upgrade for advanced features"}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="connect" className="space-y-6">
          <HubSpotConnect user={user} userSettings={userSettings} onConnectionUpdate={handleConnectionUpdate} />
          <BackupManager user={user} hubspotToken={userSettings?.hubspot_token_encrypted} />
        </TabsContent>

        <TabsContent value="pages">
          <PageManager user={user} hubspotToken={userSettings?.hubspot_token_encrypted} userSettings={userSettings} />
        </TabsContent>

        <TabsContent value="fields">
          <FieldConfigurator user={user} fieldConfigs={fieldConfigs} isPremium={isPremium} />
        </TabsContent>

        <TabsContent value="backup">
          <BackupManager user={user} hubspotToken={userSettings?.hubspot_token_encrypted} />
        </TabsContent>

        <TabsContent value="rollback">
          <RollbackManager user={user} hubspotToken={userSettings?.hubspot_token_encrypted} userSettings={userSettings} />
        </TabsContent>

        <TabsContent value="schedule">
          <AutoBackupScheduler user={user} hubspotToken={userSettings?.hubspot_token_encrypted} sheetId={sheetId} userSettings={userSettings} onSettingsUpdate={() => {}} />
        </TabsContent>

        <TabsContent value="logs">
          <AuditLogs user={user} />
        </TabsContent>

        <TabsContent value="team" className="hidden lg:block">
          <TeamManager user={user} isPremium={isPremium} />
        </TabsContent>
      </Tabs>

      {!isPremium && (
        <div className="mt-8">
          <PremiumUpgrade user={user} />
        </div>
      )}
    </div>
  )
}