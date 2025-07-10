import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("=== HubSpot Test API Called ===");

  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid token is required" },
        { status: 400 }
      );
    }

    console.log("Testing HubSpot connection...");

    // Test with a simple API call to get account info instead of token validation
    const response = await fetch(
      "https://api.hubapi.com/account-info/v3/details",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`HubSpot test response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log("Account info:", data);

      return NextResponse.json({
        success: true,
        message: "HubSpot connection successful",
        accountName: data.companyName || "HubSpot Account",
        portalId: data.portalId,
        timeZone: data.timeZone,
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log("HubSpot test error:", errorData);

      // Try alternative endpoint if account-info fails
      console.log("Trying alternative endpoint...");

      const altResponse = await fetch(
        "https://api.hubapi.com/cms/v3/pages?limit=1",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(`Alternative endpoint status: ${altResponse.status}`);

      if (altResponse.ok) {
        const altData = await altResponse.json();
        return NextResponse.json({
          success: true,
          message: "HubSpot connection successful (CMS access confirmed)",
          pagesFound: altData.total || 0,
        });
      } else {
        const altErrorData = await altResponse.json().catch(() => ({}));
        console.log("Alternative endpoint error:", altErrorData);

        return NextResponse.json({
          success: false,
          error: "Invalid HubSpot token or insufficient permissions",
          details:
            altErrorData.message ||
            "Please check your private app token and ensure it has CMS permissions",
          suggestions: [
            "Verify your private app token is correct",
            "Ensure your private app has 'CMS Pages' scopes enabled",
            "Check that the token hasn't expired",
            "Make sure you're using a private app token (starts with 'pat-')",
          ],
        });
      }
    }
  } catch (error) {
    console.error("HubSpot test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test HubSpot connection",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestions: [
          "Check your internet connection",
          "Verify the token format (should start with 'pat-')",
          "Ensure your HubSpot account has API access enabled",
        ],
      },
      { status: 500 }
    );
  }
}
