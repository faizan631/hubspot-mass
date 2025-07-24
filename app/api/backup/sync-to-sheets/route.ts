import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

// --- HELPER FUNCTIONS (These are correct, no changes needed) ---
async function fetchAllPaginatedHubspotItems(
  initialUrl: string,
  token: string,
  pageType: string
): Promise<any[]> {
  const allResults: any[] = []
  let url: string | undefined = initialUrl
  while (url) {
    try {
      const response: Response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) break
      const data = await response.json()
      allResults.push(...(data.results || []).map((item: any) => ({ ...item, pageType })))
      url = data.paging?.next?.link
    } catch (error) {
      console.error(`Pagination error at ${url}:`, error)
      break
    }
  }
  return allResults
}

async function fetchItemDetails(item: any, token: string): Promise<any> {
  let detailUrl = ''
  switch (item.pageType) {
    case 'Site Page':
      detailUrl = `https://api.hubapi.com/cms/v3/pages/site-pages/${item.id}`
      break
    case 'Landing Page':
      detailUrl = `https://api.hubapi.com/cms/v3/pages/landing-pages/${item.id}`
      break
    case 'Blog Post':
      detailUrl = `https://api.hubapi.com/cms/v3/blogs/posts/${item.id}`
      break
    default:
      return item
  }
  try {
    const response = await fetch(detailUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return { ...item, body: 'Error: Could not fetch details.' }
    const details = await response.json()
    return { ...details, pageType: item.pageType }
  } catch (err) {
    console.log(err)
    return { ...item, body: 'Error: Failed to fetch content.' }
  }
}

async function fetchScrapedWebsitePages(domain: string, token: string): Promise<any[]> {
  if (!process.env.NEXT_PUBLIC_APP_URL) return []
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/hubspot/website-scraper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, hubspotToken: token }),
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.success ? data.pages : []
  } catch (err) {
    console.log(err)
    return []
  }
}

// --- MAIN ROUTE ---
export async function POST(request: NextRequest) {
  try {
    const { userId, hubspotToken, sheetId, sheetName } = await request.json()
    if (!userId || !hubspotToken || !sheetId || !sheetName) {
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

    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('google_access_token, website_domain')
      .eq('user_id', user.id)
      .single()
    if (settingsError || !userSettings?.google_access_token) {
      return NextResponse.json(
        { success: false, error: 'Google Sheets not connected' },
        { status: 400 }
      )
    }

    // 1. Fetch ALL content from HubSpot
    console.log('Step 1: Fetching all HubSpot content...')
    const endpoints = {
      'Site Page': 'https://api.hubapi.com/cms/v3/pages/site-pages',
      'Landing Page': 'https://api.hubapi.com/cms/v3/pages/landing-pages',
      'Blog Post': 'https://api.hubapi.com/cms/v3/blogs/posts',
    }
    const contentList: any[] = []
    for (const [pageType, url] of Object.entries(endpoints)) {
      contentList.push(...(await fetchAllPaginatedHubspotItems(url, hubspotToken, pageType)))
    }
    const detailedPages = await Promise.all(
      contentList.map(item => fetchItemDetails(item, hubspotToken))
    )

    // 2. Fetch Scraped pages
    let scrapedPages: any[] = []
    if (userSettings.website_domain) {
      scrapedPages = await fetchScrapedWebsitePages(userSettings.website_domain, hubspotToken)
    }
    const normalizedScrapedPages = scrapedPages.map((p: any) => ({
      id: p.id,
      name: p.name,
      url: p.url,
      htmlTitle: p.content?.title,
      metaDescription: p.content?.metaDescription,
      slug: p.slug,
      currentState: p.status,
      createdAt: '',
      updatedAt: p.updatedAt,
      pageType: 'Website Page',
      body: p.content?.bodyText || '',
    }))

    const allPages = [...detailedPages, ...normalizedScrapedPages]
    if (allPages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No content found in HubSpot to backup.' },
        { status: 404 }
      )
    }
    console.log(`Step 2: Found a total of ${allPages.length} pages to back up.`)

    // 3. Prepare data for the sheet
    const backupDate = new Date().toISOString()
    const backupId = `backup_${Date.now()}`

    const headers = [
      [
        'Backup Date',
        'ID',
        'Name',
        'URL',
        'HTML Title',
        'Meta Description',
        'Slug',
        'State',
        'Created/Published At',
        'Updated At',
        'Content Type',
        'Body Content',
      ],
    ]
    const sheetRows = allPages.map((page: any) => [
      backupDate,
      page.id || '',
      page.name || 'Untitled',
      page.url || '',
      page.htmlTitle || page.name || '',
      page.metaDescription || '',
      page.slug || '',
      page.currentState || page.state || 'UNKNOWN',
      page.publishDate || page.createdAt || '',
      page.updatedAt || '',
      page.pageType || 'Unknown',
      page.body || '',
    ])

    // 4. Save to Google Sheets
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: userSettings.google_access_token })
    const sheets = google.sheets({ version: 'v4', auth })
    const quotedSheetName = `'${sheetName}'`

    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${quotedSheetName}!A1`,
      })
    } catch (err: any) {
      if (err.message.includes('Unable to parse range') || err.message.includes('not found')) {
        console.log(`Sheet '${sheetName}' not found. Creating it with headers.`)
        try {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: sheetId,
            requestBody: {
              requests: [{ addSheet: { properties: { title: sheetName } } }],
            },
          })
        } catch (addSheetErr: any) {
          if (!addSheetErr.message.includes('already exists')) throw addSheetErr
        }
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${quotedSheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: headers },
        })
      } else {
        throw err
      }
    }

    // ✅ Clear all previous data from A2 down before appending
    console.log(`Step 3: Clearing old data from ${quotedSheetName}...`)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: `${quotedSheetName}!A2:Z1000`, // Adjust if you expect more columns/rows
    })

    console.log(`Appending ${sheetRows.length} fresh rows to sheet: ${quotedSheetName}`)
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${quotedSheetName}!A2`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'OVERWRITE',
      requestBody: { values: sheetRows },
    })
    console.log('Google Sheets update successful.')

    // 5. Save snapshot to Supabase
    console.log(`Step 4: Saving ${allPages.length} pages to Supabase under backup_id: ${backupId}`)

    const backupDataForSupabase = allPages.map(page => ({
      user_id: user.id,
      backup_id: backupId,
      hubspot_page_id: String(page.id || 'N/A'),
      page_type: page.pageType || 'Unknown',
      name: page.name || 'Untitled',
      url: page.url || '',
      html_title: page.htmlTitle || page.name || '',
      meta_description: page.metaDescription || '',
      slug: page.slug || '',
      body_content: page.body || '',
    }))

    const { error: insertError } = await supabase
      .from('hubspot_page_backups')
      .insert(backupDataForSupabase)

    if (insertError) {
      console.error('CRITICAL: Failed to save backup to Supabase:', insertError)
      throw new Error(`Failed to save backup snapshot to database: ${insertError.message}`)
    }

    console.log('Successfully saved backup snapshot to Supabase.')

    // 6. Log to audit trail
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action_type: 'backup_and_snapshot',
      resource_type: 'google_sheet_and_db',
      resource_id: sheetId,
      details: {
        pages_synced: allPages.length,
        backup_date: backupDate,
        sheet_name: sheetName,
        db_backup_id: backupId,
      },
    })

    return NextResponse.json({
      success: true,
      pages_synced: allPages.length,
      sheet_url: `https://docs.google.com/spreadsheets/d/${sheetId}`,
    })
  } catch (error) {
    console.error('Backup failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Backup process failed.',
      },
      { status: 500 }
    )
  }
}
