// app/dashboard/reports/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportsDashboard from '@/components/dashboard/reports/ReportsDashboard'
import { getHubSpotPageCounts } from '@/lib/hubspot/api'
import { AlertTriangle } from 'lucide-react'

export default async function ReportsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the user's HubSpot token from the new user_integrations table
  const { data: hubspotIntegration } = await supabase
    .from('user_integrations')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('platform_id', 1) // Assuming 1 is the ID for 'hubspot'
    .single()

  // If the user hasn't connected HubSpot, show them a message.
  if (!hubspotIntegration?.access_token) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-background">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
        <h2 className="mt-4 text-xl font-semibold">HubSpot Not Connected</h2>
        <p className="mt-2 text-muted-foreground">
          Please connect your HubSpot account on the "Connect" page to view reports.
        </p>
      </div>
    )
  }

  // Fetch the initial page counts on the server.
  const initialData = await getHubSpotPageCounts(hubspotIntegration.access_token)
  const initialLastUpdated = new Date().toLocaleString()

  return (
    <div className="space-y-6">
      <ReportsDashboard initialData={initialData} initialLastUpdated={initialLastUpdated} />
    </div>
  )
}
