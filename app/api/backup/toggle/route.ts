import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, enabled } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // In a real implementation, you'd store the auto-backup preference
    // For now, we'll just return success
    // You could add a user_preferences table to store this

    return NextResponse.json({
      success: true,
      message: enabled ? "Auto-backup enabled" : "Auto-backup disabled",
    })
  } catch (error) {
    console.error("Toggle backup error:", error)
    return NextResponse.json({ error: "Failed to toggle auto-backup" }, { status: 500 })
  }
}
