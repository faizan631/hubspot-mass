import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

export async function POST(request: NextRequest) {
  try {
    const { userId, hubspotToken, sheetId } = await request.json()

    if (!userId || !hubspotToken || !sheetId) {
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
      .select("google_access_token, hubspot_connection_type, website_domain")
      .eq("user_id", user.id)
      .single()

    if (settingsError || !userSettings?.google_access_token) {
      return NextResponse.json({ success: false, error: "Google Sheets not connected" }, { status: 400 })
    }

    // Set up Google Sheets API
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: userSettings.google_access_token })
    const sheets = google.sheets({ version: "v4", auth })

    // Fetch HubSpot pages based on connection type
    let hubspotPages = []
    const connectionType = userSettings.hubspot_connection_type

    if (connectionType === "paid") {
      // Use HubSpot CMS API for paid accounts
      const hubspotResponse = await fetch("https://api.hubapi.com/cms/v3/pages/site-pages", {
        headers: {
          Authorization: `Bearer ${hubspotToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!hubspotResponse.ok) {
        throw new Error(`HubSpot API error: ${hubspotResponse.statusText}`)
      }

      const hubspotData = await hubspotResponse.json()
      hubspotPages = hubspotData.results || []
    } else {
      // Use free tier approach - fetch from multiple endpoints
      const endpoints = [
        "https://api.hubapi.com/cms/v3/blogs/posts",
        "https://api.hubapi.com/crm/v3/objects/contacts",
        "https://api.hubapi.com/crm/v3/objects/companies",
      ]

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${hubspotToken}`,
              "Content-Type": "application/json",
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.results) {
              hubspotPages.push(...data.results)
            }
          }
        } catch (error) {
          console.error(`Error fetching from ${endpoint}:`, error)
        }
      }

      // Add website scraping data if domain is available
      if (userSettings.website_domain) {
        try {
          const scrapingResponse = await fetch("/api/hubspot/website-scraper", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              domain: userSettings.website_domain,
              hubspotToken,
            }),
          })

          if (scrapingResponse.ok) {
            const scrapingData = await scrapingResponse.json()
            if (scrapingData.success && scrapingData.pages) {
              hubspotPages.push(...scrapingData.pages)
            }
          }
        } catch (error) {
          console.error("Website scraping error:", error)
        }
      }
    }

    if (hubspotPages.length === 0) {
      return NextResponse.json({ success: false, error: "No pages found to backup" }, { status: 400 })
    }

    // Prepare data for Google Sheets
    const backupDate = new Date().toISOString()
    const sheetData = hubspotPages.map((page: any) => [
      backupDate,
      page.id || "",
      page.name || page.title || "",
      page.url || page.publicUrl || "",
      page.htmlTitle || page.title || "",
      page.metaDescription || "",
      page.slug || "",
      page.state || page.status || "",
      page.createdAt || page.created || "",
      page.updatedAt || page.updated || "",
      page.createdBy || "",
      page.updatedBy || "",
      page.language || "en",
      page.campaign || "",
      page.contentGroupId || "",
      page.domain || userSettings.website_domain || "",
      page.subdomain || "",
      page.archivedAt ? "Archived" : "Active",
      connectionType === "paid" ? "CMS Page" : "Free Tier Data",
      page.templatePath || "",
    ])

    // Find the next empty row
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "HubSpot Pages!A:A",
    })

    const nextRow = (existingData.data.values?.length || 0) + 1

    // Append data to Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `HubSpot Pages!A${nextRow}`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: sheetData,
      },
    })

    // Log the backup session
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action_type: "backup",
      resource_type: "google_sheet",
      resource_id: sheetId,
      details: {
        pages_synced: hubspotPages.length,
        connection_type: connectionType,
        backup_date: backupDate,
        sheet_id: sheetId,
      },
    })

    return NextResponse.json({
      success: true,
      pages_synced: hubspotPages.length,
      total_pages: hubspotPages.length,
      backup_date: backupDate,
      sheet_url: `https://docs.google.com/spreadsheets/d/${sheetId}`,
    })
  } catch (error) {
    console.error("Sync to sheets error:", error)

    // Log the failed backup
    try {
      const supabase = createClient()
      await supabase.from("audit_logs").insert({
        user_id: userId,
        action_type: "backup",
        resource_type: "google_sheet",
        resource_id: sheetId,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
          failed_at: new Date().toISOString(),
        },
      })
    } catch (logError) {
      console.error("Failed to log backup error:", logError)
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Backup failed" },
      { status: 500 },
    )
  }
}
