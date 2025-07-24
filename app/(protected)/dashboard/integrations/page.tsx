import { createClient } from '@/lib/supabase/server'
import HubSpotConnect from '@/components/hubspot/HubSpotConnect'
import BackupManager from '@/components/dashboard/BackupManager'
import PremiumUpgrade from '@/components/premium/PremiumUpgrade'

export default async function ConnectPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="space-y-6">
      <HubSpotConnect user={user!} userSettings={userSettings} />
      <BackupManager user={user!} hubspotToken={userSettings?.hubspot_token_encrypted} />

      {/* You can still show the upgrade prompt on relevant pages */}
      {!userSettings?.is_premium && (
        <div className="mt-8">
          <PremiumUpgrade user={user!} />
        </div>
      )}
    </div>
  )
}
