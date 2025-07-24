import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'

// This is changed user name
export async function POST(request: NextRequest) {
  try {
    const { name, userId } = await request.json()

    if (!name || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Google tokens
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('google_access_token')
      .eq('user_id', user.id)
      .single()

    if (settingsError || !userSettings?.google_access_token) {
      return NextResponse.json(
        { success: false, error: 'Google Sheets not connected' },
        { status: 400 }
      )
    }

    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: userSettings.google_access_token })

    const sheets = google.sheets({ version: 'v4', auth })

    // ✅ Create spreadsheet with just the title
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: name },
      },
    })

    const spreadsheetId = createResponse.data.spreadsheetId!
    const spreadsheetUrl = createResponse.data.spreadsheetUrl!

    // ✅ Log the creation (optional)
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action_type: 'create',
      resource_type: 'google_sheet',
      resource_id: spreadsheetId,
      details: {
        sheet_name: name,
        sheet_url: spreadsheetUrl,
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
    console.error('Create Google Sheet error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
