// lib/actions/user.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { Theme } from "@/types"; // optional if you have types

export async function getUserData() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, theme: "system" as Theme };

  const { data: settings } = await supabase
    .from("user_settings")
    .select("theme")
    .eq("user_id", user.id)
    .single();

  const theme = (settings?.theme as Theme) || "system";

  return { user, theme };
}
