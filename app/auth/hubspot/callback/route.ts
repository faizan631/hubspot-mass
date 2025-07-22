import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET (req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  if (!code) {
    return NextResponse.redirect(
      'http://localhost:3000/dashboard?error=missing_code'
    )
  }

  const client_id = process.env.NEXT_PUBLIC_HUBSPOT_CLIENT_ID!
  const client_secret = process.env.NEXT_PUBLIC_HUBSPOT_CLIENT_SECRET!
  const redirect_uri = 'http://localhost:3000/auth/hubspot/callback'

  try {
    const tokenRes = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id,
        client_secret,
        redirect_uri,
        code
      })
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok) {
      return NextResponse.redirect(
        new URL(
          `http://localhost:3000/dashboard?error=hubspot_oauth_failed&desc=${
            tokenData.message ?? 'unknown'
          }`
        )
      )
    }

    if (!tokenData.access_token) {
      return NextResponse.redirect(
        'http://localhost:3000/dashboard/connect?error=hubspot_oauth_failed'
      )
    }

    // ✅ Save tokens to Supabase
    const supabase = createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (!user || authError) {
      console.error('Supabase user fetch error:', authError)
      return NextResponse.redirect(
        'http://localhost:3000/dashboard/connect?error=user_fetch_failed'
      )
    }

    const { error: dbError } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: user.id, // ✅ this is required for RLS to pass!
          hubspot_access_token: tokenData.access_token,
          hubspot_refresh_token: tokenData.refresh_token,
          hubspot_token_expires_at: new Date(
            Date.now() + tokenData.expires_in * 1000
          ),
          hubspot_connection_type: 'test'
        },
        { onConflict: 'user_id' }
      )
      .eq('user_id', user.id)

    if (dbError) {
      console.error('Supabase DB error:', dbError)
      return NextResponse.redirect(
        'http://localhost:3000/dashboard/connect?error=db_save_failed'
      )
    }

    return NextResponse.redirect(
      'http://localhost:3000/dashboard/connect?hubspot_oauth=success'
    )
  } catch (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(
      new URL('http://localhost:3000/dashboard?error=missing_code')
    )
  }
}
