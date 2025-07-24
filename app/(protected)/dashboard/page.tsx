import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardTabs from '@/components/dashboard/DashboardTabs'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // const { data: userSettings } = await supabase
  //   .from('user_settings')
  //   .select('*')
  //   .eq('user_id', user.id)
  //   .single()

  // const { data: fieldConfigs } = await supabase
  //   .from('field_configurations')
  //   .select('*')
  //   .eq('user_id', user.id)
  //   .order('field_name')

  const success = searchParams.success
  const error = searchParams.error

  return (
    <div className="min-h-screen">
      {/* Status messages */}
      {success === 'google_connected' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">Google Sheets connected successfully!</span>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{getOAuthErrorMessage(error as string)}</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto">
        <DashboardTabs /* user={user} userSettings={userSettings} fieldConfigs={fieldConfigs || []} */
        />
      </main>
    </div>
  )
}

// Helper to handle OAuth messages
function getOAuthErrorMessage(error: string) {
  const messages: Record<string, string> = {
    oauth_failed: 'Google OAuth failed. Please try connecting again.',
    missing_params: 'OAuth callback missing required parameters.',
    token_exchange_failed: 'Failed to exchange OAuth tokens.',
    db_error: 'Database error occurred during connection. This might be a duplicate record issue.',
    db_update_error: 'Failed to update your Google connection settings.',
    db_insert_error: 'Failed to save your Google connection settings.',
    callback_error: 'An error occurred during the OAuth callback.',
    oauth_not_configured: 'Google OAuth is not properly configured.',
  }

  return messages[error] ?? 'An unknown error occurred.'
}
