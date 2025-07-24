import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Request body:', body)

    const {
      hubspot_token,
      hubspot_connection_type,
      website_domain,
      google_refresh_token,
      backup_sheet_id,
    } = body

    // Prepare update data - only include fields that are provided
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (hubspot_token !== undefined) {
      updateData.hubspot_token_encrypted = hubspot_token
    }
    if (hubspot_connection_type !== undefined) {
      updateData.hubspot_connection_type = hubspot_connection_type
    }
    if (website_domain !== undefined) {
      updateData.website_domain = website_domain
    }
    if (google_refresh_token !== undefined) {
      updateData.google_refresh_token = google_refresh_token
    }
    if (backup_sheet_id !== undefined) {
      updateData.backup_sheet_id = backup_sheet_id
    }

    console.log('Update data:', updateData)

    // Check if user settings already exist
    const { data: existingSettings, error: selectError } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (selectError) {
      console.error('Select error:', selectError)
      return NextResponse.json(
        {
          success: false,
          error: `Database select error: ${selectError.message}`,
        },
        { status: 500 }
      )
    }

    if (existingSettings) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, ...updateData }, { onConflict: 'user_id' })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json(
          {
            success: false,
            error: `Failed to update settings: ${updateError.message}`,
          },
          { status: 500 }
        )
      }
    } else {
      // Insert new record
      const insertData = {
        user_id: user.id,
        ...updateData,
      }

      const { error: insertError } = await supabase.from('user_settings').insert(insertData)

      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.json(
          {
            success: false,
            error: `Failed to create settings: ${insertError.message}`,
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userSettings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Get settings error:', error)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to get settings: ${error.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      settings: userSettings || {},
    })
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    )
  }
}
