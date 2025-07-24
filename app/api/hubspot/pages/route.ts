// File: /api/hubspot/pages/route.ts
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('=== Fetching All HubSpot Pages (Unified) ===')

  try {
    const { token, hubspotToken } = await request.json()
    const finalToken = token || hubspotToken

    if (!finalToken || typeof finalToken !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid token is required' },
        { status: 400 }
      )
    }

    const headers = {
      Authorization: `Bearer ${finalToken}`,
      'Content-Type': 'application/json',
    }

    const pages: any[] = []

    const fetchPaginated = async (url: string, key: string = 'results') => {
      const result: any[] = []
      let nextUrl: string | null = url

      while (nextUrl) {
        const res: Response = await fetch(nextUrl, { headers })
        if (!res.ok) break
        const data = await res.json()
        const items = data[key] || data.objects || []
        result.push(...items)
        nextUrl = data.paging?.next?.after
          ? `${url.split('?')[0]}?limit=100&after=${data.paging.next.after}`
          : null
      }

      return result
    }

    // Try multiple endpoints
    const endpoints = [
      { name: 'CMS Pages', url: 'https://api.hubapi.com/cms/v3/pages?limit=100', key: 'results' },
      {
        name: 'Site Pages',
        url: 'https://api.hubapi.com/cms/v3/site-pages?limit=100',
        key: 'results',
      },
      {
        name: 'Content Pages',
        url: 'https://api.hubapi.com/content/api/v2/pages?limit=100',
        key: 'objects',
      },
    ]

    for (const endpoint of endpoints) {
      try {
        const result = await fetchPaginated(endpoint.url, endpoint.key)
        if (result.length) {
          console.log(`✅ Found ${result.length} pages from ${endpoint.name}`)
          pages.push(...result)
        }
      } catch (e) {
        console.warn(`❌ Failed to fetch from ${endpoint.name}`, e)
      }
    }

    if (pages.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No pages accessible. Check your token's scopes or try again later.",
      })
    }

    const extractDomain = (url: string): string => {
      try {
        return new URL(url.startsWith('http') ? url : `https://${url}`).hostname
      } catch {
        return 'unknown.domain'
      }
    }

    const mappedPages = pages.map((page: any, i: number) => ({
      id: page.id || page.page_id || `page-${i}`,
      name: page.name || page.title || page.html_title || `Page ${i + 1}`,
      slug: page.slug || page.path || page.url_path || page.page_path || '',
      url:
        page.url ||
        page.absolute_url ||
        page.published_url ||
        `https://dummy.com/${page.slug || ''}`,
      htmlTitle: page.html_title || page.meta_title || '',
      metaDescription: page.meta_description || '',
      state: page.state || page.currentState || 'PUBLISHED',
      createdAt: page.created || page.createdAt || new Date().toISOString(),
      updatedAt: page.updated || page.updatedAt || page.publish_date || new Date().toISOString(),
      domain: extractDomain(page.url || page.absolute_url || page.published_url || ''),
    }))

    return NextResponse.json({
      success: true,
      pages: mappedPages,
      total: mappedPages.length,
    })
  } catch (error) {
    console.error('Page fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pages',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
