// FILE: /api/sync/to-hubspot/route.ts

import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

// Translates our database/sheet field names to the names HubSpot's API expects.
const hubspotFieldMapping: { [key: string]: string } = {
  name: 'name',
  html_title: 'htmlTitle',
  meta_description: 'metaDescription',
  slug: 'slug',
  body_content: 'body', // Our 'body_content' maps to HubSpot's 'body' property
}

export async function POST(request: NextRequest) {
  try {
    const { userId, hubspotToken, changes } = await request.json()

    if (!userId || !hubspotToken || !Array.isArray(changes) || changes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
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

    // --- Determine Page Types from our Database ---
    // This is crucial to know which HubSpot endpoint to call (Site Page vs. Landing Page).
    const pageIdsToUpdate = changes.map(c => c.pageId)
    const { data: pageTypesData, error: pageTypesError } = await supabase
      .from('hubspot_page_backups')
      .select('hubspot_page_id, page_type')
      .in('hubspot_page_id', pageIdsToUpdate)

    if (pageTypesError) throw pageTypesError

    const pageTypeMap = new Map(pageTypesData.map(p => [p.hubspot_page_id, p.page_type]))

    // --- Process Each Change and Sync to HubSpot ---
    const succeeded: any[] = []
    const failed: any[] = []

    for (const change of changes) {
      const pageId = change.pageId
      const pageType = pageTypeMap.get(pageId)

      if (!pageType) {
        failed.push({ pageId, name: change.name, error: 'Page type not found in database backup.' })
        continue
      }

      let updateUrl = ''
      if (pageType === 'Site Page') {
        updateUrl = `https://api.hubapi.com/cms/v3/pages/site-pages/${pageId}`
      } else if (pageType === 'Landing Page') {
        updateUrl = `https://api.hubapi.com/cms/v3/pages/landing-pages/${pageId}`
      } else {
        failed.push({
          pageId,
          name: change.name,
          error: `Syncing for page type '${pageType}' is not supported yet.`,
        })
        continue
      }

      // Construct the payload for the PATCH request
      const payload: { [key: string]: any } = {}
      for (const [fieldKey, value] of Object.entries(change.fields)) {
        const hubspotKey = hubspotFieldMapping[fieldKey]
        if (hubspotKey) {
          payload[hubspotKey] = (value as any).new
        }
      }

      // Skip if there's nothing to update
      if (Object.keys(payload).length === 0) continue

      try {
        const response = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${hubspotToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          const result = await response.json()
          succeeded.push({ pageId, name: change.name, url: result.url })
        } else {
          const errorData = await response.json()
          failed.push({
            pageId,
            name: change.name,
            error: errorData.message || `HTTP Error ${response.status}`,
          })
        }
      } catch (error) {
        failed.push({
          pageId,
          name: change.name,
          error: error instanceof Error ? error.message : 'Network error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sync process completed.',
      succeeded,
      failed,
    })
  } catch (error) {
    console.error('Sync to HubSpot error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    return NextResponse.json(
      { success: false, error: `Failed to sync changes: ${errorMessage}` },
      { status: 500 }
    )
  }
}
