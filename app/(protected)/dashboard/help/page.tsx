// app/dashboard/help/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HelpPageContent from "@/components/help/HelpPageContent";

export default async function HelpPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  // Check if the user already saw the help
  const { data: settings, error } = await supabase
    .from("user_settings")
    .select("has_seen_help")
    .eq("user_id", user.id)
    .single();

  if (!error && settings?.has_seen_help) {
    return redirect("/dashboard/backup");
  }

  // Mark help as seen
  await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, has_seen_help: true }, { onConflict: 'user_id' })
    .eq("user_id", user.id);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <HelpPageContent />
    </div>
  );
}
