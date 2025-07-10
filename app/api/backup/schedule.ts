import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  console.log("=== Backup Schedule API Called ===")

  try {
    const { userId, schedule, connections } = await request.json()

    if (!userId || !schedule) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // In a real implementation, you would:
    // 1. Set up a cron job using a service like Vercel Cron, GitHub Actions, or a dedicated cron service
    // 2. Store the schedule in the database
    // 3. Create webhook endpoints for the cron service to call

    // For now, we'll just save the schedule settings
    const { error: updateError } = await supabase.from("user_settings").upsert({
      user_id: userId,
      backup_schedule: schedule,
      updated_at: new Date().toISOString(),
    })

    if (updateError) {
      throw updateError
    }

    // Log the schedule setup
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action_type: "configure",
      resource_type: "backup_schedule",
      details: { schedule, enabled: schedule.enabled },
    })

    return NextResponse.json({
      success: true,
      message: schedule.enabled
        ? `Backup scheduled ${schedule.frequency} at ${schedule.time}`
        : "Backup schedule disabled",
      nextRun: schedule.enabled ? calculateNextRun(schedule) : null,
    })
  } catch (error) {
    console.error("Schedule setup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to set up backup schedule",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function calculateNextRun(schedule: any): string {
  const now = new Date()
  const [hours, minutes] = schedule.time.split(":").map(Number)
  const nextRun = new Date(now)
  nextRun.setHours(hours, minutes, 0, 0)

  if (nextRun <= now) {
    switch (schedule.frequency) {
      case "daily":
        nextRun.setDate(nextRun.getDate() + 1)
        break
      case "weekly":
        nextRun.setDate(nextRun.getDate() + 7)
        break
      case "monthly":
        nextRun.setMonth(nextRun.getMonth() + 1)
        break
    }
  }

  return nextRun.toISOString()
}
