// lib/google-auth.ts
import { SupabaseClient } from '@supabase/supabase-js'
import { google } from 'googleapis'

export async function getAuthenticatedGoogleClient(supabase: SupabaseClient, userId: string) {
  // 1. Fetch the user's securely stored refresh token
  const { data: settings, error } = await supabase
    .from('user_settings')
    .select('google_refresh_token')
    .eq('user_id', userId)
    .single()

  if (error || !settings?.google_refresh_token) {
    throw new Error('Google account not connected or refresh token missing.')
  }

  // 2. Create an OAuth2 client and set the refresh token
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    refresh_token: settings.google_refresh_token,
  })

  // 3. The library will automatically use the refresh token to get a new
  // access token when needed.
  return oauth2Client
}
