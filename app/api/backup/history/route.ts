import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const date = searchParams.get("date")
    const pageId = searchParams.get("pageId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = await createClient()
    let query = supabase
      .from("change_history")
      .select(`
        *,
        changed_by_user:auth.users!changed_by(email)
      `)
      .eq("user_id", userId)
      .order("changed_at", { ascending: false })

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)

      query = query.gte("changed_at", startDate.toISOString()).lt("changed_at", endDate.toISOString())
    }

    if (pageId) {
      query = query.eq("page_id", pageId)
    }

    const { data: changes, error } = await query.limit(100)

    if (error) {
      console.error("Failed to fetch change history:", error)
      return NextResponse.json({ error: "Failed to fetch change history" }, { status: 500 })
    }

    return NextResponse.json({ success: true, changes })
  } catch (error) {
    console.error("Change history error:", error)
    return NextResponse.json({ error: "Failed to fetch change history" }, { status: 500 })
  }
}
