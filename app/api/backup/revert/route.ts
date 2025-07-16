// FILE: /api/history/revert/route.ts (Final Version with Google Sheet Logging and URL Return)

import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// This helper function correctly gets an authenticated Google API client
async function getRefreshedGoogleClient(userId: string, supabase: any) {
  const { data: userSettings, error } = await supabase
    .from("user_settings")
    .select("google_access_token, google_refresh_token, backup_sheet_id")
    .eq("user_id", userId)
    .single();

  if (error || !userSettings?.google_refresh_token) {
    throw new Error("Google connection not found or refresh token is missing.");
  }

  if (!userSettings.backup_sheet_id) {
    throw new Error("No backup Google Sheet ID is configured for this user.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: userSettings.google_refresh_token,
  });

  const { token: newAccessToken } = await oauth2Client.getAccessToken();

  if (newAccessToken && newAccessToken !== userSettings.google_access_token) {
    await supabase
      .from("user_settings")
      .update({ google_access_token: newAccessToken })
      .eq("user_id", userId);
  }

  oauth2Client.setCredentials({
    access_token: newAccessToken,
    refresh_token: userSettings.google_refresh_token,
  });

  return {
    sheets: google.sheets({ version: "v4", auth: oauth2Client }),
    spreadsheetId: userSettings.backup_sheet_id,
  };
}

const hubspotFieldMapping: { [key: string]: string } = {
  name: "name",
  html_title: "htmlTitle",
  meta_description: "metaDescription",
  slug: "slug",
  state: "currentState",
  body_content: "body",
};

export async function POST(request: NextRequest) {
  // This variable is declared here so it can be accessed in the final return statement.
  let newSheetUrl = "";

  try {
    const { userId, hubspotToken, versionId } = await request.json();

    if (!userId || !hubspotToken || !versionId) {
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

    // This correctly fetches the historical data from your database.
    const { data: targetVersionData, error: versionError } = await supabase
      .from("hubspot_page_backups")
      .select("*")
      .eq("backup_id", versionId);

    if (versionError || !targetVersionData || targetVersionData.length === 0) {
      throw new Error(`Could not find version with ID: ${versionId}`);
    }

    // This block correctly creates the new tab and writes the data.
    try {
      const { sheets, spreadsheetId } = await getRefreshedGoogleClient(
        user.id,
        supabase
      );
      const revertTimestamp = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const newSheetTitle = `Revert - ${revertTimestamp}`;

      // This is the call that ADDS a new tab to your EXISTING file.
      const addSheetResponse = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: newSheetTitle } } }],
        },
      });

      // This logic gets the unique ID of the new tab...
      const newSheetId =
        addSheetResponse.data.replies?.[0]?.addSheet?.properties?.sheetId;

      // ...and correctly builds the direct link to that tab.
      if (newSheetId) {
        newSheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${newSheetId}`;
      }

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
      const sheetRows = targetVersionData.map((page: any) => [
        page.backup_date || new Date(page.created_at).toISOString(),
        page.hubspot_page_id,
        page.name,
        page.url,
        page.html_title,
        page.meta_description,
        page.slug,
        page.state,
        page.created_at,
        page.updated_at,
        page.page_type,
        page.body_content,
      ]);

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${newSheetTitle}'!A1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers, ...sheetRows] },
      });
    } catch (sheetError) {
      console.error("Failed to write revert log to Google Sheet:", sheetError);
    }

    // This block correctly syncs the old data back to HubSpot.
    const succeeded: any[] = [];
    const failed: any[] = [];
    for (const pageToRevert of targetVersionData) {
      // ... (all the logic for PATCH and POST to HubSpot is correct)
      const pageId = pageToRevert.hubspot_page_id;
      const pageType = pageToRevert.page_type;
      const contentPayload: { [key: string]: any } = {};
      for (const key in hubspotFieldMapping) {
        if (
          key !== "state" &&
          pageToRevert[key as keyof typeof pageToRevert] !== undefined
        ) {
          contentPayload[hubspotFieldMapping[key]] =
            pageToRevert[key as keyof typeof pageToRevert];
        }
      }
      const needsPublishing = pageToRevert.state === "PUBLISHED";
      let pageWasPublished = false;
      try {
        if (Object.keys(contentPayload).length > 0) {
          const updateUrl = `https://api.hubapi.com/cms/v3/pages/${
            pageType === "Site Page" ? "site-pages" : "landing-pages"
          }/${pageId}`;
          const res = await fetch(updateUrl, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${hubspotToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(contentPayload),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(`Content update failed: ${err.message}`);
          }
        }
        if (needsPublishing) {
          const publishUrl = `https://api.hubapi.com/cms/v3/pages/${
            pageType === "Site Page" ? "site-pages" : "landing-pages"
          }/${pageId}/publish-action`;
          const res = await fetch(publishUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${hubspotToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ action: "schedule-publish" }),
          });
          if (res.status !== 204) {
            let errText = `HTTP ${res.status}`;
            try {
              const err = await res.json();
              errText = err.message;
            } catch (e) {}
            throw new Error(`Publish failed: ${errText}`);
          }
          pageWasPublished = true;
        }
        succeeded.push({
          pageId,
          name: pageToRevert.name,
          published: pageWasPublished,
        });
      } catch (error) {
        failed.push({
          pageId,
          name: pageToRevert.name,
          error:
            error instanceof Error ? error.message : "Revert action failed",
        });
      }
    }

    // This block correctly creates a new snapshot in your database for the version history.
    if (succeeded.length > 0) {
      const newRevertSnapshotId = `revert_${Date.now()}`;
      const newSnapshotData = targetVersionData.map((page) => ({
        ...page,
        backup_id: newRevertSnapshotId,
        created_at: new Date().toISOString(),
      }));
      newSnapshotData.forEach((p) => delete (p as any).id);
      await supabase.from("hubspot_page_backups").insert(newSnapshotData);
    }

    // Finally, this returns the URL you need for the frontend toast.
    return NextResponse.json({
      success: true,
      message: "Revert process completed.",
      succeeded,
      failed,
      revertSheetUrl: newSheetUrl,
    });
  } catch (error) {
    console.error("Revert to version error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json(
      { success: false, error: `Failed to revert to version: ${errorMessage}` },
      { status: 500 }
    );
  }
}
