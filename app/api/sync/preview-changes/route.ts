// FILE: /api/sync/preview-changes/route.ts

import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { diff_match_patch } from "diff-match-patch";

// *** This is the new, reusable helper function to get a valid Google client ***
async function getRefreshedGoogleClient(userId: string, supabase: any) {
  const { data: userSettings, error } = await supabase
    .from("user_settings")
    .select("google_access_token, google_refresh_token")
    .eq("user_id", userId)
    .single();

  if (error || !userSettings?.google_refresh_token) {
    // If there's no refresh token, the user needs to re-authenticate.
    throw new Error(
      "Google connection not found or refresh token is missing. Please reconnect your Google account."
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Set the refresh token so the client knows how to get a new access token.
  oauth2Client.setCredentials({
    refresh_token: userSettings.google_refresh_token,
  });

  // The googleapis library is smart. It will check if the access token is expired
  // and automatically use the refresh token to get a new one if necessary.
  // We can directly request a new token to be sure and update our DB.
  const { token: newAccessToken } = await oauth2Client.getAccessToken();

  // It's good practice to update the database with the new access token,
  // though the client will hold it in memory for subsequent requests in this session.
  if (newAccessToken && newAccessToken !== userSettings.google_access_token) {
    await supabase
      .from("user_settings")
      .update({ google_access_token: newAccessToken })
      .eq("user_id", userId);
  }

  // Set the full credentials on the client for the current request
  oauth2Client.setCredentials({
    access_token: newAccessToken,
    refresh_token: userSettings.google_refresh_token,
  });

  // Return a ready-to-use Sheets API client
  return google.sheets({ version: "v4", auth: oauth2Client });
}

// Helper function to find column index (no changes needed)
function getColumnIndex(headers: string[], name: string): number {
  return headers.findIndex(
    (h) => h.toLowerCase().trim() === name.toLowerCase().trim()
  );
}

export async function POST(request: NextRequest) {
  try {
    const { userId, sheetId, sheetName } = await request.json();

    if (!userId || !sheetId || !sheetName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
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

    // *** THE FIX: Use our new helper to get a guaranteed valid Google Sheets client ***
    const sheets = await getRefreshedGoogleClient(user.id, supabase);

    // 2. Fetch the LATEST data from the user's Google Sheet
    console.log(`Fetching data from Google Sheet: '${sheetName}'`);
    const sheetResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'${sheetName}'`,
    });

    const sheetRows = sheetResponse.data.values;
    if (!sheetRows || sheetRows.length <= 1) {
      return NextResponse.json({
        success: true,
        changes: [],
        message: "No data in sheet to compare.",
      });
    }

    const headers = sheetRows.shift()!.map((h) => String(h));
    const idIndex = getColumnIndex(headers, "ID");
    const nameIndex = getColumnIndex(headers, "Name");
    const bodyIndex = getColumnIndex(headers, "Body Content");

    if (idIndex === -1 || bodyIndex === -1) {
      throw new Error(
        "Could not find required columns ('ID', 'Body Content') in the sheet."
      );
    }

    const sheetDataMap = new Map(
      sheetRows.map((row) => [
        row[idIndex],
        { name: row[nameIndex] || "", body_content: row[bodyIndex] || "" },
      ])
    );

    // 3. Fetch the MOST RECENT backup snapshot from your Supabase DB
    const { data: latestBackupRun, error: backupIdError } = await supabase
      .from("hubspot_page_backups")
      .select("backup_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (backupIdError || !latestBackupRun) {
      return NextResponse.json({
        success: true,
        changes: [],
        message: "No database backup found to compare against.",
      });
    }

    const { data: dbBackupData, error: dbError } = await supabase
      .from("hubspot_page_backups")
      .select("*")
      .eq("user_id", user.id)
      .eq("backup_id", latestBackupRun.backup_id);

    if (dbError) throw dbError;
    const supabaseDataMap = new Map(
      dbBackupData.map((row) => [row.hubspot_page_id, row])
    );

    // 4. Compare the two datasets and generate a "diff"
    const changes: any[] = [];
    const dmp = new diff_match_patch();

    for (const [pageId, sheetPage] of sheetDataMap.entries()) {
      const dbPage = supabaseDataMap.get(pageId);
      if (dbPage) {
        const modifiedFields: any = {};
        let isModified = false;
        if (sheetPage.name !== dbPage.name) {
          isModified = true;
          modifiedFields.name = { old: dbPage.name, new: sheetPage.name };
        }
        if (sheetPage.body_content !== dbPage.body_content) {
          isModified = true;
          const diff = dmp.diff_main(
            dbPage.body_content || "",
            sheetPage.body_content || ""
          );
          dmp.diff_cleanupSemantic(diff);
          modifiedFields.body_content_diff = dmp.diff_prettyHtml(diff);
        }
        if (isModified) {
          changes.push({
            pageId: pageId,
            name: sheetPage.name,
            type: "modified",
            fields: modifiedFields,
          });
        }
      }
    }

    console.log(`Found ${changes.length} modified pages.`);
    return NextResponse.json({ success: true, changes: changes });
  } catch (error) {
    console.error("Preview changes error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json(
      { success: false, error: `Failed to preview changes: ${errorMessage}` },
      { status: 500 }
    );
  }
}
