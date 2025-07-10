import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { google } from "googleapis"

export const dynamic = "force-dynamic"; 

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state") // This contains the user ID
    const error = searchParams.get("error")

    if (error) {
      console.error("Google OAuth error:", error)
      return NextResponse.redirect(new URL("/dashboard?error=oauth_failed", request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL("/dashboard?error=missing_params", request.url))
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
      return NextResponse.redirect(new URL("/dashboard?error=oauth_not_configured", request.url))
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    )

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token) {
      return NextResponse.redirect(new URL("/dashboard?error=token_exchange_failed", request.url))
    }

    // Save tokens to database
    const supabase = createClient()
    const userId = state

    const { error: dbError } = await supabase.from("user_settings").upsert({
      user_id: userId,
      google_access_token: tokens.access_token,
      google_refresh_token: tokens.refresh_token,
      google_token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      updated_at: new Date().toISOString(),
    })

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.redirect(new URL("/dashboard?error=db_error", request.url))
    }

    // Log the connection
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action_type: "connect",
      resource_type: "google_sheets",
      details: {
        connected_at: new Date().toISOString(),
        has_refresh_token: !!tokens.refresh_token,
      },
    })

    return NextResponse.redirect(new URL("/dashboard?success=google_connected", request.url))
  } catch (error) {
    console.error("Google OAuth callback error:", error)
    return NextResponse.redirect(new URL("/dashboard?error=callback_error", request.url))
  }
}
