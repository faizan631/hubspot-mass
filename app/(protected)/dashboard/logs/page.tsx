// app/dashboard/pages/page.tsx

import { createClient } from "@/lib/supabase/server";
import PremiumUpgrade from "@/components/premium/PremiumUpgrade";
import AuditLogs from "@/components/audit/AuditLogs";

export default async function LogesRoute() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="text-red-500">User not found</div>;
  }

  const { data: userSettings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!userSettings) {
    return <div className="text-red-500">User settings not found</div>;
  }

  const hubspotToken = userSettings?.hubspot_token_encrypted;

  return (
    <div className="space-y-6">
      <AuditLogs
        user={user}
        hubspotToken={hubspotToken}
        userSettings={userSettings}
      />

      {/* Premium prompt (optional) */}
      {!userSettings?.is_premium && (
        <div className="mt-8">
          <PremiumUpgrade user={user} />
        </div>
      )}
    </div>
  );
}
