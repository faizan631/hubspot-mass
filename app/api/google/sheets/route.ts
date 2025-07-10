import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { google } from "googleapis"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get user's Google tokens
    const { data: userSettings, error: settingsError } = await supabase
      .from("user_settings")
      .select("google_access_token, google_refresh_token, google_token_expires_at")
      .eq("user_id", user.id)
      .single()

    if (settingsError || !userSettings?.google_access_token) {
      return NextResponse.json({ success: false, error: "Google Sheets not connected" }, { status: 400 })
    }

    // Check if token needs refresh
    const now = new Date()
    const expiresAt = userSettings.google_token_expires_at ? new Date(userSettings.google_token_expires_at) : null

    let accessToken = userSettings.google_access_token

    if (expiresAt && now >= expiresAt && userSettings.google_refresh_token) {
      // Refresh the token
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI,
      )

      oauth2Client.setCredentials({
        refresh_token: userSettings.google_refresh_token,
      })

      try {
        const { credentials } = await oauth2Client.refreshAccessToken()
        accessToken = credentials.access_token!

        // Update the database with new token
        await supabase
          .from("user_settings")
          .update({
            google_access_token: accessToken,
            google_token_expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
          })
          .eq("user_id", user.id)
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError)
        return NextResponse.json({ success: false, error: "Token refresh failed" }, { status: 401 })
      }
    }

    // Set up Google Sheets API
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })

    const sheets = google.sheets({ version: "v4", auth })
    const drive = google.drive({ version: "v3", auth })

    // List spreadsheets
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      orderBy: "modifiedTime desc",
      pageSize: 50,
      fields: "files(id,name,webViewLink,createdTime,modifiedTime)",
    })

    const spreadsheets =
      response.data.files?.map((file) => ({
        id: file.id!,
        name: file.name!,
        url: file.webViewLink!,
        createdTime: file.createdTime!,
        modifiedTime: file.modifiedTime!,
      })) || []

    return NextResponse.json({
      success: true,
      sheets: spreadsheets,
    })
  } catch (error) {
    console.error("Google Sheets API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch Google Sheets" }, { status: 500 })
  }
}
