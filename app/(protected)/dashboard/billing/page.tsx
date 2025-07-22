// app/dashboard/billing/page.tsx (CORRECTED)
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BillingPlans from "@/components/dashboard/BillingPlans"; // <-- Use the correct component with the pricing plans

export default async function BillingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the user's current plan status
  const { data: userSettings } = await supabase
    .from("user_settings")
    .select("is_premium")
    .eq("user_id", user.id)
    .single();

  const isPremium = userSettings?.is_premium || false;

  // Render the BillingPlans component and pass it the data it needs
  return <BillingPlans user={user} isPremium={isPremium} />;
}
