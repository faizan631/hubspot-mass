// app/dashboard/backup/page.tsx

import { createClient } from '@/lib/supabase/server'
import BackupManager from '@/components/dashboard/BackupManager'
import PremiumUpgrade from '@/components/premium/PremiumUpgrade'

export default async function BackupRoute() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div className="text-red-500">User not found</div>
  }

  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!userSettings) {
    return <div className="text-red-500">User settings not found</div>
  }

  const hubspotToken = userSettings?.hubspot_token_encrypted

  return (
    <div className="space-y-6">
      <BackupManager user={user} hubspotToken={hubspotToken} /* userSettings={userSettings} */ />

      {!userSettings?.is_premium && (
        <div className="mt-8">
          <PremiumUpgrade user={user} />
        </div>
      )}
    </div>
  )
}
