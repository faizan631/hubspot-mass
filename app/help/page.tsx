// FILE: app/help/page.tsx

import { createClient } from "@/lib/supabase/server";
import { OverviewCard, QuickStep } from "@/components/dashboard/OverviewParts"; // assume these are extracted
import { redirect } from "next/navigation";

export default async function HelpPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Optional: Fetch user-specific data here if needed

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">Welcome to Smurves</h1>
      <p className="text-muted-foreground">
        Here's how to get started and make the most out of your HubSpot–Sheets
        integration.
      </p>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <OverviewCard title="HubSpot" status="Connected" />
        <OverviewCard title="Google Sheets" status="Connected" />
        <OverviewCard title="Plan" status="Free" />
      </div>

      {/* Quick Start Guide */}
      <div>
        <h2 className="text-xl font-semibold mt-6">Quick Start Guide</h2>
        <div className="space-y-4 mt-2">
          <QuickStep step={1} label="Connect HubSpot account" />
          <QuickStep step={2} label="Connect Google Sheets" />
          <QuickStep step={3} label="Map fields to sync" />
          <QuickStep step={4} label="Start syncing content!" />
        </div>
      </div>
    </div>
  );
}
