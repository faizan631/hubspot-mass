import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, pageId, updates, hubspotToken, sheetId } =
      await request.json();

    if (!userId || !pageId || !updates || !hubspotToken) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get current page data from HubSpot
    const hubspotResponse = await fetch(
      "https://api.hubapi.com/cms/v3/pages/" + pageId,
      {
        headers: {
          Authorization: `Bearer ${hubspotToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!hubspotResponse.ok) {
      throw new Error("Failed to fetch page from HubSpot");
    }

    const currentPage = await hubspotResponse.json();
    const changes = [];

    // Track changes
    for (const [field, newValue] of Object.entries(updates)) {
      const oldValue = currentPage[field];
      if (oldValue !== newValue) {
        changes.push({
          field_name: field,
          old_value: oldValue,
          new_value: newValue,
          change_type: "update",
        });
      }
    }

    if (changes.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No changes detected",
      });
    }

    // Update the page in HubSpot
    const updateResponse = await fetch(
      "https://api.hubapi.com/cms/v3/pages/" + pageId,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${hubspotToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(errorData.message || "Failed to update page in HubSpot");
    }

    const updatedPage = await updateResponse.json();

    // Record changes in history
    for (const change of changes) {
      await supabase.from("change_history").insert({
        user_id: userId,
        page_id: pageId,
        field_name: change.field_name,
        old_value: change.old_value,
        new_value: change.new_value,
        change_type: change.change_type,
        changed_by: userId,
      });
    }

    // Update snapshot
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("page_snapshots").upsert({
      user_id: userId,
      page_id: pageId,
      page_name: updatedPage.name,
      page_slug: updatedPage.slug,
      page_url: updatedPage.url,
      page_content: updatedPage,
      snapshot_date: today,
    });

    // Update Google Sheets if provided
    if (sheetId) {
      await updateGoogleSheets(userId, sheetId, updatedPage, changes);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${changes.length} field(s)`,
      changes: changes.length,
      updatedPage,
    });
  } catch (error) {
    console.error("Page edit error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update page",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function updateGoogleSheets(
  userId: string,
  sheetId: string,
  updatedPage: any,
  changes: any[]
) {
  try {
    const supabase = await createClient();

    // Get user's Google refresh token
    const { data: tokenData, error: tokenError } = await supabase
      .from("user_tokens")
      .select("google_refresh_token")
      .eq("user_id", userId)
      .single();

    if (tokenError || !tokenData?.google_refresh_token) {
      throw new Error("Google refresh token not found");
    }

    // Get fresh access token
    const accessToken = await refreshGoogleToken(
      tokenData.google_refresh_token
    );

    // Get current date for sheet tab
    const today = new Date().toISOString().split("T")[0];

    // Prepare sheet data
    const sheetData = [
      [
        "Page ID",
        "Page Name",
        "Page URL",
        "Field Changed",
        "Old Value",
        "New Value",
        "Timestamp",
      ],
      ...changes.map((change) => [
        updatedPage.id,
        updatedPage.name,
        updatedPage.url,
        change.field_name,
        String(change.old_value),
        String(change.new_value),
        new Date().toISOString(),
      ]),
    ];

    // Update Google Sheets
    await updateSheetTab(sheetId, today, sheetData, accessToken);
  } catch (error) {
    console.error("Google Sheets update error:", error);
    // Don't fail the entire operation if sheets update fails
  }
}

async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Google token");
  }

  const data = await response.json();
  return data.access_token;
}

async function updateSheetTab(
  sheetId: string,
  tabName: string,
  data: any[][],
  accessToken: string
) {
  // First, try to create the tab (it might already exist)
  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: tabName,
                },
              },
            },
          ],
        }),
      }
    );
  } catch (error) {
    // Tab might already exist, continue
  }

  // Clear existing data and add new data
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A:Z:clear`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  // Add new data
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A1`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: data,
        majorDimension: "ROWS",
      }),
    }
  );
}
