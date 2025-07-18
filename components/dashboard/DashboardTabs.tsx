// app/dashboards/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import PremiumUpgrade from "@/components/premium/PremiumUpgrade"; // Assuming this component exists

export default async function DashboardOverviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth");
  }

  // NOTE: You'll need a function to get user-specific settings.
  // This is just a placeholder. Replace with your actual data fetching logic.
  const { data: userSettings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const isPremium = userSettings?.is_premium || false;
  const isHubSpotConnected = !!userSettings?.hubspot_token_encrypted;
  const isGoogleConnected = !!userSettings?.google_refresh_token;
  const sheetId = userSettings?.backup_sheet_id;

  return (
    <div className="w-full space-y-6">
      {/* Status Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border">
          <h3 className="font-semibold mb-2 text-slate-800">
            HubSpot Connection
          </h3>
          <Badge variant={isHubSpotConnected ? "default" : "secondary"}>
            {isHubSpotConnected ? "Connected" : "Not Connected"}
          </Badge>
          <p className="text-sm text-slate-600 mt-2">
            {isHubSpotConnected
              ? "Ready to sync pages and content."
              : "Connect your account to get started."}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold mb-2 text-slate-800">Google Sheets</h3>
          <Badge variant={isGoogleConnected ? "default" : "secondary"}>
            {isGoogleConnected ? "Connected" : "Not Connected"}
          </Badge>
          <p className="text-sm text-slate-600 mt-2">
            {sheetId ? "Backup sheet is selected." : "No backup sheet chosen."}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold mb-2 text-slate-800">Account Plan</h3>
          <Badge
            variant={isPremium ? "default" : "secondary"}
            className="flex items-center gap-1.5 w-fit"
          >
            {isPremium ? (
              <>
                <Crown className="h-3.5 w-3.5" />
                Premium
              </>
            ) : (
              "Free Plan"
            )}
          </Badge>
          <p className="text-sm text-slate-600 mt-2">
            {isPremium
              ? "All features unlocked. Thank you!"
              : "Upgrade for advanced features like Rollback."}
          </p>
        </div>
      </div>

      {/* Quick Start Guide Section */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="font-semibold mb-4 text-slate-800">Quick Start Guide</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isHubSpotConnected
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              1
            </div>
            <span
              className={
                isHubSpotConnected
                  ? "text-slate-500 line-through"
                  : "text-slate-600"
              }
            >
              Connect your HubSpot account
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isGoogleConnected
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              2
            </div>
            <span
              className={
                isGoogleConnected
                  ? "text-slate-500 line-through"
                  : "text-slate-600"
              }
            >
              Connect Google Sheets & select a sheet
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">
              3
            </div>
            <span className="text-slate-600">
              Configure your field settings (optional)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">
              4
            </div>
            <span className="text-slate-600">
              Run your first store operation
            </span>
          </div>
        </div>
      </div>

      {/* Premium Upgrade Prompt */}
      {!isPremium && (
        <div className="mt-8">
          <PremiumUpgrade user={user} />
        </div>
      )}
    </div>
  );
}
