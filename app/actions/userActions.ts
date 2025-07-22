// app/actions/userActions.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers"; // ✅ 1. IMPORT cookies
import { revalidatePath } from "next/cache";

// Define a reusable type for the theme
export type Theme = "light" | "dark" | "system";

/**
 * Gets the current user and their saved theme preference from the database.
 * This runs on the server and is used by the layout.
 */
export async function getUserData() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore); // ✅ Pass cookies to the client

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // If no user is logged in, return a default state
    return { user: null, theme: "system" as Theme };
  }

  // Fetch the user's settings to get the theme
  const { data: settings } = await supabase
    .from("user_settings") // ⚠️ Make sure "user_settings" is your correct table name
    .select("theme")
    .eq("user_id", user.id) // ⚠️ Make sure "user_id" is your correct column name
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
  const supabase = createClient(cookieStore); // ✅ Pass cookies to the client

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // ✅ 2. Use .upsert() for efficiency
  // This will UPDATE the row if one with the user_id exists, or INSERT it if not.
  const { error } = await supabase
    .from("user_settings") // ⚠️ Your table name
    .upsert(
      {
        user_id: user.id, // ⚠️ Your foreign key column to auth.users
        theme: theme,
        updated_at: new Date().toISOString(), // Good practice to update a timestamp
      },
      { onConflict: "user_id" } // Tells Supabase to check for conflicts on the 'user_id' column
    );

  if (error) {
    console.error("Error upserting user theme:", error);
    throw new Error("Failed to save theme preference.");
  }

  // Revalidate the layout to ensure the new theme is fetched on the next page load
  revalidatePath("/dashboard", "layout");

  return { success: true };
}
