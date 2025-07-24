// app/dashboard/rollback/page.tsx

import { createClient } from '@/lib/supabase/server'
import RollbackManager from '@/components/enhanced/RollbackManager'
import PremiumUpgrade from '@/components/premium/PremiumUpgrade'

export default async function RollbackRoute() {
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
      <RollbackManager user={user} hubspotToken={hubspotToken} userSettings={userSettings} />

      {!userSettings?.is_premium && (
        <div className="mt-8">
          <PremiumUpgrade user={user} />
        </div>
      )}
    </div>
  )
}
