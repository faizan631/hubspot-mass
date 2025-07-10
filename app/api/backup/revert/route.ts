import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, pageId, fieldName, revertValue, hubspotToken } = await request.json()

    if (!userId || !pageId || !fieldName || !hubspotToken) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current page data from HubSpot
    const hubspotResponse = await fetch("https://api.hubapi.com/cms/v3/pages/" + pageId, {
      headers: {
        Authorization: `Bearer ${hubspotToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!hubspotResponse.ok) {
      throw new Error("Failed to fetch page from HubSpot")
    }

    const currentPage = await hubspotResponse.json()
    const oldValue = currentPage[fieldName]

    // Update the page in HubSpot
    const updateData = { [fieldName]: revertValue }

    const updateResponse = await fetch("https://api.hubapi.com/cms/v3/pages/" + pageId, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${hubspotToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    })

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json()
      throw new Error(errorData.message || "Failed to update page in HubSpot")
    }

    // Record the revert action in change history
    await supabase.from("change_history").insert({
      user_id: userId,
      page_id: pageId,
      field_name: fieldName,
      old_value: oldValue,
      new_value: revertValue,
      change_type: "update",
      changed_by: userId,
    })

    // Update the snapshot
    const today = new Date().toISOString().split("T")[0]
    const updatedPage = { ...currentPage, [fieldName]: revertValue }

    await supabase.from("page_snapshots").upsert({
      user_id: userId,
      page_id: pageId,
      page_name: updatedPage.name,
      page_slug: updatedPage.slug,
      page_url: updatedPage.url,
      page_content: updatedPage,
      snapshot_date: today,
    })

    return NextResponse.json({
      success: true,
      message: `Successfully reverted ${fieldName} to previous value`,
      oldValue,
      newValue: revertValue,
    })
  } catch (error) {
    console.error("Revert error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to revert change",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
