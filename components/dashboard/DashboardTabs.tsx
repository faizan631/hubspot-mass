"use client"

import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Crown } from "lucide-react"

// Import all our advanced components
import BackupManager from "@/components/dashboard/BackupManager"
import HubSpotConnect from "@/components/hubspot/HubSpotConnect"
import PageManager from "@/components/pages/PageManager"
import FieldConfigurator from "@/components/fields/FieldConfigurator"
import RollbackManager from "@/components/enhanced/RollbackManager"
import AutoBackupScheduler from "@/components/enhanced/AutoBackupScheduler"
import AuditLogs from "@/components/audit/AuditLogs"
import TeamManager from "@/components/team/TeamManager"
import PremiumUpgrade from "@/components/premium/PremiumUpgrade"

interface DashboardTabsProps {
  user: User
  userSettings: any
  fieldConfigs: any[]
}

export default function DashboardTabs({ user, userSettings, fieldConfigs }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [currentUserSettings, setCurrentUserSettings] = useState(userSettings)

  // Update local state when userSettings prop changes
  useEffect(() => {
    setCurrentUserSettings(userSettings)
  }, [userSettings])

  const isPremium = currentUserSettings?.is_premium || false
  const hubspotToken = currentUserSettings?.hubspot_token_encrypted
  const sheetId = currentUserSettings?.backup_sheet_id
  const isHubSpotConnected = !!hubspotToken

  const handleConnectionUpdate = (connected: boolean, token?: string, connectionType?: string) => {
    // Update local state immediately for UI responsiveness
    setCurrentUserSettings((prev: any) => ({
      ...prev,
      hubspot_token_encrypted: connected ? token : null,
      hubspot_connection_type: connected ? connectionType : null,
    }))
  }

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

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Connection Status Cards */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">HubSpot Connection</h3>
              <Badge variant={isHubSpotConnected ? "default" : "secondary"}>
                {isHubSpotConnected ? "Connected" : "Not Connected"}
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                {isHubSpotConnected ? "Ready to sync pages" : "Connect to start backing up"}
              </p>
              {currentUserSettings?.hubspot_connection_type && (
                <p className="text-xs text-gray-500 mt-1">
                  Type: {currentUserSettings.hubspot_connection_type === "paid" ? "Full CMS" : "Free Tier"}
                </p>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">Google Sheets</h3>
              <Badge variant={currentUserSettings?.google_refresh_token ? "default" : "secondary"}>
                {currentUserSettings?.google_refresh_token ? "Connected" : "Not Connected"}
              </Badge>
              <p className="text-sm text-gray-600 mt-2">{sheetId ? `Sheet selected` : "No backup sheet selected"}</p>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">Account Plan</h3>
              <Badge variant={isPremium ? "default" : "secondary"} className="flex items-center gap-1 w-fit">
                {isPremium ? (
                  <>
                    <Crown className="h-3 w-3" />
                    Premium
                  </>
                ) : (
                  "Free Plan"
                )}
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                {isPremium ? "All features unlocked" : "Upgrade for advanced features"}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold mb-4">Quick Start Guide</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isHubSpotConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  1
                </div>
                <span className={isHubSpotConnected ? "text-green-700" : "text-gray-600"}>
                  Connect your HubSpot account
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentUserSettings?.google_refresh_token
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  2
                </div>
                <span className={currentUserSettings?.google_refresh_token ? "text-green-700" : "text-gray-600"}>
                  Connect Google Sheets
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <span className="text-gray-600">Configure your field settings</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <span className="text-gray-600">Run your first backup</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Connect Tab */}
        <TabsContent value="connect" className="space-y-6">
          <HubSpotConnect user={user} userSettings={currentUserSettings} onConnectionUpdate={handleConnectionUpdate} />
          <BackupManager user={user} hubspotToken={currentUserSettings?.hubspot_token_encrypted} />
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages">
          <PageManager
            user={user}
            hubspotToken={currentUserSettings?.hubspot_token_encrypted}
            userSettings={currentUserSettings}
          />
        </TabsContent>

        {/* Fields Tab */}
        <TabsContent value="fields">
          <FieldConfigurator user={user} fieldConfigs={fieldConfigs} isPremium={isPremium} />
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup">
          <BackupManager user={user} hubspotToken={currentUserSettings?.hubspot_token_encrypted} />
        </TabsContent>

        {/* Rollback Tab (Premium) */}
        <TabsContent value="rollback">
          <RollbackManager
            user={user}
            hubspotToken={currentUserSettings?.hubspot_token_encrypted}
            userSettings={currentUserSettings}
          />
        </TabsContent>

        {/* Schedule Tab (Premium) */}
        <TabsContent value="schedule">
          <AutoBackupScheduler
            user={user}
            hubspotToken={currentUserSettings?.hubspot_token_encrypted}
            sheetId={sheetId}
            userSettings={currentUserSettings}
            onSettingsUpdate={() => {}}
          />
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <AuditLogs user={user} />
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="hidden lg:block">
          <TeamManager user={user} isPremium={isPremium} />
        </TabsContent>
      </Tabs>

      {/* Premium Upgrade Prompt */}
      {!isPremium && (
        <div className="mt-8">
          <PremiumUpgrade user={user} />
        </div>
      )}
    </div>
  )
}
