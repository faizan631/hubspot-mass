"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// Define a reusable type for the theme
export type Theme = "light" | "dark" | "system";

/**
 * Gets the current user and their saved theme preference from the database.
 * This runs on the server and is used by the layout.
 */
export async function getUserData() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // If no user is logged in, return a default state
    return { user: null, theme: "system" as Theme };
  }

  // Fetch the user's settings to get the theme
  const { data: settings } = await supabase
    .from("user_settings")
    .select("theme")
    .eq("user_id", user.id)
    .single();

  // If the user has a theme saved, use it. Otherwise, default to 'system'.
  const theme = (settings?.theme as Theme) || ("system" as Theme);

  return { user, theme };
}

/**
 * Updates (or inserts) the theme for the currently logged-in user.
 * This is a server action called from the client-side Navbar.
 */
export async function updateUserTheme(theme: Theme) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // ✅ Use .upsert() for efficiency
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      theme: theme,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Error upserting user theme:", error);
    throw new Error("Failed to save theme preference.");
  }

  // Set theme cookie for immediate access
  cookieStore.set("theme", theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });

  // Revalidate the layout to ensure the new theme is fetched
  revalidatePath("/dashboard", "layout");

  return { success: true };
}
