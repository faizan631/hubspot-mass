import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("=== HubSpot Pages API Called ===");

  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid token is required" },
        { status: 400 }
      );
    }

    console.log("Fetching pages from HubSpot...");

    // Try multiple HubSpot API endpoints specifically for website pages
    const endpoints = [
      {
        name: "Website Pages API v2",
        url: "https://api.hubapi.com/content/api/v2/pages?limit=100",
      },
      {
        name: "CMS Pages v3 (All states)",
        url: "https://api.hubapi.com/cms/v3/pages?limit=100",
      },
      {
        name: "CMS Pages v3 (Published only)",
        url: "https://api.hubapi.com/cms/v3/pages?limit=100&archived=false",
      },
      {
        name: "Website Pages with state filter",
        url: "https://api.hubapi.com/content/api/v2/pages?limit=100&state=PUBLISHED",
      },
      {
        name: "CMS Site Pages",
        url: "https://api.hubapi.com/cms/v3/site-pages?limit=100",
      },
    ];

    let allPages: any[] = [];
    let successfulEndpoint = "";
    let lastError = "";

    for (const endpoint of endpoints) {
      console.log(`\n🔍 Trying ${endpoint.name}`);
      console.log(`URL: ${endpoint.url}`);

      try {
        const response = await fetch(endpoint.url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log(`Status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          console.log(`Response keys:`, Object.keys(data));
          console.log(`Full response:`, JSON.stringify(data, null, 2));

          // Check for pages in different response formats
          const pages = data.results || data.objects || data.pages || [];

          if (Array.isArray(pages) && pages.length > 0) {
            console.log(
              `✅ SUCCESS! Found ${pages.length} pages with ${endpoint.name}`
            );
            allPages = pages;
            successfulEndpoint = endpoint.name;
            break;
          } else {
            console.log(`❌ No pages found in response`);
          }
        } else {
          const errorText = await response.text();
          console.log(
            `❌ HTTP ${response.status}:`,
            errorText.substring(0, 300)
          );
          lastError = errorText;
        }
      } catch (fetchError) {
        console.log(`❌ Network error:`, fetchError);
        lastError = String(fetchError);
      }
    }

    // If no pages found, try to get more debugging info
    if (allPages.length === 0) {
      console.log("\n🔍 No pages found. Trying additional debugging...");

      // Check what scopes the token has
      try {
        const tokenInfo = await fetch(
          "https://api.hubapi.com/oauth/v1/access-tokens/" + token,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (tokenInfo.ok) {
          const tokenData = await tokenInfo.json();
          console.log("Token scopes:", tokenData.scopes);
        }
      } catch (e) {
        console.log("Could not check token scopes");
      }

      return NextResponse.json({
        success: false,
        error: `No pages found in your HubSpot account. Your website (243154020.hs-sites-na2.com) exists but the API isn't returning pages. This might be due to: 1) Missing API scopes in your token, 2) Pages are in a different API endpoint, or 3) Different HubSpot account structure.`,
        debug: {
          websiteUrl: "243154020.hs-sites-na2.com",
          lastError: lastError.substring(0, 200),
          suggestion:
            "Check your HubSpot private app permissions include 'CMS Pages' and 'Website Pages'",
        },
      });
    }

    // Function to extract domain from URL
    const extractDomain = (url: string): string => {
      try {
        if (!url) return "243154020.hs-sites-na2.com"; // Default to your domain
        const urlObject = new URL(
          url.startsWith("http") ? url : `https://${url}`
        );
        return urlObject.hostname;
      } catch (error) {
        return "243154020.hs-sites-na2.com";
      }
    };

    // Transform the data to match our expected format
    const pages = allPages.map((page: any, index: number) => {
      console.log(
        `\nProcessing page ${index + 1}:`,
        JSON.stringify(page, null, 2)
      );

      return {
        id: page.id || page.page_id || page.contentId || String(index),
        name:
          page.name ||
          page.html_title ||
          page.page_title ||
          page.htmlTitle ||
          page.title ||
          page.meta_title ||
          `Page ${index + 1}`,
        slug: page.slug || page.path || page.url_path || page.page_path || "",
        url:
          page.url ||
          page.absolute_url ||
          page.published_url ||
          page.public_url ||
          `https://243154020.hs-sites-na2.com/${page.slug || ""}`,
        language: page.language || page.primaryLanguage || page.lang || "en",
        domain: extractDomain(
          page.url || page.absolute_url || page.published_url || ""
        ),
        updatedAt:
          page.updatedAt ||
          page.updated ||
          page.updated_at ||
          page.publish_date ||
          new Date().toISOString(),
        status:
          page.currentState ||
          page.state ||
          page.publish_immediately ||
          "PUBLISHED",
      };
    });

    console.log(
      `\n✅ Successfully processed ${pages.length} pages from ${successfulEndpoint}`
    );
    console.log("Final processed pages:", JSON.stringify(pages, null, 2));

    return NextResponse.json({
      success: true,
      pages,
      total: pages.length,
      endpoint: successfulEndpoint,
      websiteUrl: "243154020.hs-sites-na2.com",
    });
  } catch (error) {
    console.error("HubSpot pages fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pages from HubSpot",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
