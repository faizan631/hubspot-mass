import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardTabs from "@/components/dashboard/DashboardTabs"
import { Badge } from "@/components/ui/badge"
import { Crown, AlertCircle, CheckCircle } from "lucide-react"

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Get user settings and field configurations
  const { data: userSettings } = await supabase.from("user_settings").select("*").eq("user_id", user.id).single()

  const { data: fieldConfigs } = await supabase
    .from("field_configurations")
    .select("*")
    .eq("user_id", user.id)
    .order("field_name")

  // Handle OAuth callback messages
  const success = searchParams.success
  const error = searchParams.error

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Smuves Dashboard</h1>
                <p className="text-sm text-gray-500">HubSpot Backup & Sync Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={userSettings?.is_premium ? "default" : "secondary"} className="flex items-center gap-1">
                {userSettings?.is_premium ? (
                  <>
                    <Crown className="h-3 w-3" />
                    Premium
                  </>
                ) : (
                  "Free Plan"
                )}
              </Badge>
              <div className="text-sm text-gray-600">Welcome, {user.email}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Status Messages */}
      {success === "google_connected" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">Google Sheets connected successfully! You can now create backups.</span>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">
              {error === "oauth_failed" && "Google OAuth failed. Please try connecting again."}
              {error === "missing_params" && "OAuth callback missing required parameters."}
              {error === "token_exchange_failed" && "Failed to exchange OAuth tokens."}
              {error === "db_error" &&
                "Database error occurred during connection. This might be a duplicate record issue."}
              {error === "db_update_error" && "Failed to update your Google connection settings."}
              {error === "db_insert_error" && "Failed to save your Google connection settings."}
              {error === "callback_error" && "An error occurred during the OAuth callback."}
              {error === "oauth_not_configured" && "Google OAuth is not properly configured."}
              {![
                "oauth_failed",
                "missing_params",
                "token_exchange_failed",
                "db_error",
                "db_update_error",
                "db_insert_error",
                "callback_error",
                "oauth_not_configured",
              ].includes(error as string) && "An unknown error occurred."}
            </span>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardTabs user={user} userSettings={userSettings} fieldConfigs={fieldConfigs || []} />
      </main>
    </div>
  )
}
