// app/auth/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  return redirect("/");
}