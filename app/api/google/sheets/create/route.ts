import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { google } from "googleapis"

export async function POST(request: NextRequest) {
  try {
    const { name, userId } = await request.json()

    if (!name || !userId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
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

    // Set up Google Sheets API
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: userSettings.google_access_token })

    const sheets = google.sheets({ version: "v4", auth })

    // Create new spreadsheet
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: name,
        },
        sheets: [
          {
            properties: {
              title: "HubSpot Pages",
              gridProperties: {
                rowCount: 1000,
                columnCount: 20,
              },
            },
          },
        ],
      },
    })

    const spreadsheetId = createResponse.data.spreadsheetId!
    const spreadsheetUrl = createResponse.data.spreadsheetUrl!

    // Add headers to the sheet
    const headers = [
      "Backup Date",
      "Page ID",
      "Page Name",
      "Page URL",
      "HTML Title",
      "Meta Description",
      "Slug",
      "State",
      "Created At",
      "Updated At",
      "Created By",
      "Updated By",
      "Language",
      "Campaign",
      "Content Group ID",
      "Domain",
      "Subdomain",
      "Archive Status",
      "Page Type",
      "Template Path",
    ]

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "HubSpot Pages!A1:T1",
      valueInputOption: "RAW",
      requestBody: {
        values: [headers],
      },
    })

    // Format the header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: headers.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                  },
                },
              },
              fields: "userEnteredFormat(backgroundColor,textFormat)",
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: "COLUMNS",
                startIndex: 0,
                endIndex: headers.length,
              },
            },
          },
        ],
      },
    })

    // Log the creation
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action_type: "create",
      resource_type: "google_sheet",
      resource_id: spreadsheetId,
      details: {
        sheet_name: name,
        sheet_url: spreadsheetUrl,
        headers_count: headers.length,
      },
    })

    return NextResponse.json({
      success: true,
      sheet: {
        id: spreadsheetId,
        name,
        url: spreadsheetUrl,
        createdTime: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Create Google Sheet error:", error)
    return NextResponse.json({ success: false, error: "Failed to create Google Sheet" }, { status: 500 })
  }
}
