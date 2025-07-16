// FILE: /api/backup/sync-to-sheets/route.ts (Corrected with Overwrite Logic)

import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// --- HELPER FUNCTIONS (Unchanged) ---
async function fetchAllPaginatedHubspotItems(
  initialUrl: string,
  token: string,
  pageType: string
): Promise<any[]> {
  const allResults: any[] = [];
  let url: string | undefined = initialUrl;
  while (url) {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) break;
      const data = await response.json();
      allResults.push(
        ...(data.results || []).map((item: any) => ({ ...item, pageType }))
      );
      url = data.paging?.next?.link;
    } catch (error) {
      console.error(`Pagination error at ${url}:`, error);
      break;
    }
  }
  return allResults;
}

async function fetchItemDetails(item: any, token: string): Promise<any> {
  let detailUrl = "";
  switch (item.pageType) {
    case "Site Page":
      detailUrl = `https://api.hubapi.com/cms/v3/pages/site-pages/${item.id}`;
      break;
    case "Landing Page":
      detailUrl = `https://api.hubapi.com/cms/v3/pages/landing-pages/${item.id}`;
      break;
    case "Blog Post":
      detailUrl = `https://api.hubapi.com/cms/v3/blogs/posts/${item.id}`;
      break;
    default:
      return item;
  }
  try {
    const response = await fetch(detailUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok)
      return { ...item, body: "Error: Could not fetch details." };
    const details = await response.json();
    return { ...details, pageType: item.pageType };
  } catch (err) {
    return { ...item, body: "Error: Failed to fetch content." };
  }
}

async function fetchScrapedWebsitePages(
  domain: string,
  token: string
): Promise<any[]> {
  if (!process.env.NEXT_PUBLIC_APP_URL) return [];
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/hubspot/website-scraper`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, hubspotToken: token }),
      }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.success ? data.pages : [];
  } catch (err) {
    return [];
  }
}

// --- MAIN ROUTE ---
export async function POST(request: NextRequest) {
  try {
    const { userId, hubspotToken, sheetId, sheetName } = await request.json();
    if (!userId || !hubspotToken || !sheetId || !sheetName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: userSettings, error: settingsError } = await supabase
      .from("user_settings")
      .select("google_access_token, website_domain")
      .eq("user_id", user.id)
      .single();
    if (settingsError || !userSettings?.google_access_token) {
      return NextResponse.json(
        { success: false, error: "Google Sheets not connected" },
        { status: 400 }
      );
    }

    // --- Steps 1 & 2: Fetching data (Unchanged) ---
    console.log("Step 1: Fetching all HubSpot content...");
    const endpoints = {
      "Site Page": "https://api.hubapi.com/cms/v3/pages/site-pages",
      "Landing Page": "https://api.hubapi.com/cms/v3/pages/landing-pages",
      "Blog Post": "https://api.hubapi.com/cms/v3/blogs/posts",
    };
    let contentList: any[] = [];
    for (const [pageType, url] of Object.entries(endpoints)) {
      contentList.push(
        ...(await fetchAllPaginatedHubspotItems(url, hubspotToken, pageType))
      );
    }
    const detailedPages = await Promise.all(
      contentList.map((item) => fetchItemDetails(item, hubspotToken))
    );
    let scrapedPages: any[] = [];
    if (userSettings.website_domain) {
      scrapedPages = await fetchScrapedWebsitePages(
        userSettings.website_domain,
        hubspotToken
      );
    }
    const normalizedScrapedPages = scrapedPages.map((p: any) => ({
      id: p.id,
      name: p.name,
      url: p.url,
      htmlTitle: p.content?.title,
      metaDescription: p.content?.metaDescription,
      slug: p.slug,
      currentState: p.status,
      createdAt: "",
      updatedAt: p.updatedAt,
      pageType: "Website Page",
      body: p.content?.bodyText || "",
    }));
    const allPages = [...detailedPages, ...normalizedScrapedPages];
    if (allPages.length === 0) {
      return NextResponse.json(
        { success: false, error: "No content found in HubSpot to backup." },
        { status: 404 }
      );
    }
    console.log(
      `Step 2: Found a total of ${allPages.length} pages to back up.`
    );

    // --- Step 3: Prepare data (Unchanged, but now includes the state) ---
    const backupId = `backup_${Date.now()}`;
    const headers = [
      "Backup Date",
      "ID",
      "Name",
      "URL",
      "HTML Title",
      "Meta Description",
      "Slug",
      "State",
      "Created/Published At",
      "Updated At",
      "Content Type",
      "Body Content",
    ];
    const sheetRows = allPages.map((page: any) => [
      new Date().toISOString(), // Use a consistent timestamp for all rows in this backup
      page.id || "",
      page.name || "Untitled",
      page.url || "",
      page.htmlTitle || page.name || "",
      page.metaDescription || "",
      page.slug || "",
      page.currentState || page.state || "UNKNOWN",
      page.publishDate || page.createdAt || "",
      page.updatedAt || "",
      page.pageType || "Unknown",
      page.body || "",
    ]);

    // --- Step 4: Save to Google Sheets (MODIFIED LOGIC) ---
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: userSettings.google_access_token });
    const sheets = google.sheets({ version: "v4", auth });
    const quotedSheetName = `'${sheetName}'`;

    // A. Clear existing data from the sheet (from row 2 downwards)
    console.log(
      `Step 3: Clearing previous data from sheet: ${quotedSheetName}`
    );
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: `${quotedSheetName}!A2:L`, // Clears all columns from row 2 to the end
    });

    // B. Update the sheet with the new rows starting from A2
    console.log(`Step 4: Writing ${sheetRows.length} new rows to sheet.`);
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${quotedSheetName}!A2`, // Start writing at cell A2, right below the headers
      valueInputOption: "USER_ENTERED",
      requestBody: { values: sheetRows },
    });
    console.log("Google Sheets Overwrite successful.");

    // --- Step 5: Save to Supabase (MODIFIED to include state) ---
    console.log(
      `Step 5: Saving ${allPages.length} pages to Supabase under backup_id: ${backupId}`
    );
    const backupDataForSupabase = allPages.map((page, index) => ({
      user_id: user.id,
      backup_id: backupId,
      hubspot_page_id: String(page.id || "N/A"),
      page_type: page.pageType || "Unknown",
      name: page.name || "Untitled",
      url: page.url || "",
      html_title: page.htmlTitle || page.name || "",
      meta_description: page.metaDescription || "",
      slug: page.slug || "",
      state: page.currentState || page.state || "UNKNOWN", // <-- ADDED STATE
      body_content: page.body || "",
      created_at: sheetRows[index][8] || new Date().toISOString(), // Use consistent created_at
      updated_at: sheetRows[index][9] || new Date().toISOString(), // Use consistent updated_at
      backup_date: sheetRows[index][0], // Use consistent backup_date
    }));

    const { error: insertError } = await supabase
      .from("hubspot_page_backups")
      .insert(backupDataForSupabase);

    if (insertError) {
      console.error(
        "CRITICAL: Failed to save backup to Supabase:",
        insertError
      );
      throw new Error(
        `Failed to save backup snapshot to database: ${insertError.message}`
      );
    }
    console.log("Successfully saved backup snapshot to Supabase.");

    // --- Step 6: Audit Log (Unchanged) ---
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action_type: "backup_and_snapshot",
      resource_type: "google_sheet_and_db",
      resource_id: sheetId,
      details: {
        pages_synced: allPages.length,
        backup_date: new Date().toISOString(),
        sheet_name: sheetName,
        db_backup_id: backupId,
      },
    });

    return NextResponse.json({
      success: true,
      pages_synced: allPages.length,
      sheet_url: `https://docs.google.com/spreadsheets/d/${sheetId}`,
    });
  } catch (error) {
    console.error("Backup failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Backup process failed.",
      },
      { status: 500 }
    );
  }
}
