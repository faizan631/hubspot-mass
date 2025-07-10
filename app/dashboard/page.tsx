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

  // We only need the user's email for the header, which is safe to use.
  // We fetch userSettings on the client now, so we can't display the premium badge here.
  // We'll move that logic to the client.
  const success = searchParams.success
  const error = searchParams.error

  return (
    <div className="min-h-screen bg-gray-50">
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
              {/* The premium badge will now be handled inside DashboardTabs */}
              <div className="text-sm text-gray-600">Welcome, {user.email}</div>
            </div>
          </div>
        </div>
      </header>

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
              {/* Other error messages */}
            </span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Render the component with NO props. It will fetch its own data. */}
        <DashboardTabs />
      </main>
    </div>
  )
}