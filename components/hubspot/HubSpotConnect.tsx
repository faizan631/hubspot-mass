"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, Globe, Database, Zap, Crown, CheckCircle } from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface HubSpotConnectProps {
  user: User
  userSettings: any
  onConnectionUpdate?: (connected: boolean, token?: string, connectionType?: string) => void
}

export default function HubSpotConnect({ user, userSettings, onConnectionUpdate }: HubSpotConnectProps) {
  const [token, setToken] = useState("")
  const [domain, setDomain] = useState(userSettings?.website_domain || "")
  const [isConnected, setIsConnected] = useState(!!userSettings?.hubspot_token_encrypted)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [connectionType, setConnectionType] = useState<"paid" | "free" | null>(
    userSettings?.hubspot_connection_type || null,
  )
  const [activeTab, setActiveTab] = useState("paid")
  const { toast } = useToast()

  useEffect(() => {
    // Initialize state from userSettings
    setIsConnected(!!userSettings?.hubspot_token_encrypted)
    setConnectionType(userSettings?.hubspot_connection_type || null)
    setDomain(userSettings?.website_domain || "")
  }, [userSettings])

  const saveConnection = async (hubspotToken: string, connType: "paid" | "free", websiteDomain?: string) => {
    setSaving(true)
    try {
      const response = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hubspot_token: hubspotToken,
          hubspot_connection_type: connType,
          website_domain: websiteDomain || null,
        }),
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to save connection")
      }

      toast({
        title: "Connection Saved! ✅",
        description: "Your HubSpot connection has been saved successfully",
      })

      // Notify parent component
      onConnectionUpdate?.(true, hubspotToken, connType)

      return true
    } catch (error) {
      console.error("Save connection error:", error)
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save connection",
        variant: "destructive",
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  const testPaidConnection = async () => {
    if (!token.trim()) {
      toast({
        title: "Error",
        description: "Please enter a HubSpot token",
        variant: "destructive",
      })
      return
    }

    setTesting(true)
    try {
      const response = await fetch("/api/hubspot/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()
      setTestResults(data)

      if (data.success) {
        // Save the connection
        const saved = await saveConnection(token, "paid")
        if (saved) {
          setIsConnected(true)
          setConnectionType("paid")
          toast({
            title: "HubSpot Connected! 🎉",
            description: `Connected to ${data.accountName || "HubSpot account"} with full CMS access`,
          })
        }
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Failed to connect to HubSpot",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test HubSpot connection",
        variant: "destructive",
      })
    }
    setTesting(false)
  }

  const testFreeTierConnection = async () => {
    if (!token.trim()) {
      toast({
        title: "Error",
        description: "Please enter a HubSpot token",
        variant: "destructive",
      })
      return
    }

    setTesting(true)
    try {
      const response = await fetch("/api/hubspot/free-tier-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()
      setTestResults(data)

      if (data.success) {
        // Save the connection
        const saved = await saveConnection(token, "free", domain)
        if (saved) {
          setIsConnected(true)
          setConnectionType("free")
          toast({
            title: "HubSpot Connected! 🎉",
            description: `Found ${data.total} items across ${data.successfulEndpoints?.length || 0} data types`,
          })
        }
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Failed to connect to HubSpot",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test HubSpot connection",
        variant: "destructive",
      })
    }
    setTesting(false)
  }

  const testWebsiteScraping = async () => {
    if (!domain.trim()) {
      toast({
        title: "Error",
        description: "Please enter your website domain",
        variant: "destructive",
      })
      return
    }

    setTesting(true)
    try {
      const response = await fetch("/api/hubspot/website-scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, hubspotToken: token }),
      })

      const data = await response.json()
      setTestResults({ ...testResults, scraping: data })

      if (data.success) {
        // Update domain in database
        await saveConnection(token, "free", domain)
        toast({
          title: "Website Scraping Successful! 🎉",
          description: `Found ${data.total} pages on your website`,
        })
      } else {
        toast({
          title: "Scraping Failed",
          description: data.error || "Failed to scrape website",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to scrape website",
        variant: "destructive",
      })
    }
    setTesting(false)
  }

  const disconnect = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hubspot_token: null,
          hubspot_connection_type: null,
          website_domain: null,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setToken("")
        setDomain("")
        setIsConnected(false)
        setTestResults(null)
        setConnectionType(null)
        onConnectionUpdate?.(false)
        toast({
          title: "Disconnected",
          description: "HubSpot connection has been removed",
        })
      } else {
        throw new Error(data.error || "Failed to disconnect")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect HubSpot",
        variant: "destructive",
      })
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            HubSpot Connection
          </CardTitle>
          <CardDescription>
            Connect to HubSpot using either paid CMS access or free tier + website scraping
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paid" className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Paid Plan
                </TabsTrigger>
                <TabsTrigger value="free" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Free Tier
                </TabsTrigger>
              </TabsList>

              {/* Paid Plan Tab */}
              <TabsContent value="paid" className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Full CMS Access</h4>
                      <p className="text-sm text-green-800 mt-1">
                        Direct access to all website pages, content, and metadata through HubSpot's CMS API
                      </p>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    testPaidConnection()
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="hubspot-token-paid">HubSpot Private App Token</Label>
                    <Input
                      id="hubspot-token-paid"
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                    <p className="text-xs text-gray-500">Requires CMS Pages API access (paid HubSpot plan)</p>
                  </div>
                  <Button type="submit" disabled={testing || saving} className="w-full">
                    {testing ? "Testing Connection..." : saving ? "Saving..." : "Test & Save CMS Connection"}
                  </Button>
                </form>
              </TabsContent>

              {/* Free Tier Tab */}
              <TabsContent value="free" className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900">CMS Pages API Not Available</h4>
                      <p className="text-sm text-amber-800 mt-1">
                        The CMS Pages API requires a paid HubSpot plan. We'll use alternative methods:
                      </p>
                      <ul className="text-sm text-amber-800 mt-2 space-y-1">
                        <li>
                          • <strong>Free APIs:</strong> Blog posts, contacts, companies, deals, forms
                        </li>
                        <li>
                          • <strong>Website Scraping:</strong> Extract pages from your website directly
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="api" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="api" className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      HubSpot APIs
                    </TabsTrigger>
                    <TabsTrigger value="scraping" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website Scraping
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="api" className="space-y-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        testFreeTierConnection()
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="hubspot-token-free">HubSpot Private App Token</Label>
                        <Input
                          id="hubspot-token-free"
                          type="password"
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        />
                        <p className="text-xs text-gray-500">
                          This will access: Blog posts, Contacts, Companies, Deals, Forms
                        </p>
                      </div>
                      <Button type="submit" disabled={testing || saving} className="w-full">
                        {testing ? "Testing Connection..." : saving ? "Saving..." : "Test & Save HubSpot APIs"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="scraping" className="space-y-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        testWebsiteScraping()
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="website-domain">Your Website Domain</Label>
                        <Input
                          id="website-domain"
                          type="text"
                          value={domain}
                          onChange={(e) => setDomain(e.target.value)}
                          placeholder="example.com or 12345.hs-sites.com"
                        />
                        <p className="text-xs text-gray-500">Enter your HubSpot website domain (without https://)</p>
                      </div>
                      <Button type="submit" disabled={testing || saving} className="w-full">
                        {testing ? "Scraping Website..." : saving ? "Saving..." : "Scrape Website Pages"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-600">
                    Connected to HubSpot ({connectionType === "paid" ? "Full CMS" : "Free Tier"})
                  </span>
                  {connectionType === "paid" && <Badge variant="default">Premium</Badge>}
                </div>
                <Button variant="outline" size="sm" onClick={disconnect} disabled={saving}>
                  {saving ? "Disconnecting..." : "Disconnect"}
                </Button>
              </div>

              {connectionType === "free" && domain && (
                <div className="text-sm text-gray-600">
                  Website domain: <span className="font-mono">{domain}</span>
                </div>
              )}
            </div>
          )}

          {/* Test Results */}
          {testResults && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">Connection Results:</h4>
              {testResults.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Success</Badge>
                    <span className="text-sm">
                      {testResults.total ? `Found ${testResults.total} items` : "Connection successful"}
                    </span>
                  </div>
                  {testResults.breakdown && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(testResults.breakdown).map(
                        ([type, count]) =>
                          count > 0 && (
                            <div key={type} className="flex justify-between">
                              <span className="capitalize">{type.replace("_", " ")}:</span>
                              <span className="font-medium">{count as number}</span>
                            </div>
                          ),
                      )}
                    </div>
                  )}
                  {testResults.successfulEndpoints && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600">
                        Working APIs: {testResults.successfulEndpoints.join(", ")}
                      </p>
                    </div>
                  )}
                  {testResults.accountName && (
                    <p className="text-sm text-gray-600">Account: {testResults.accountName}</p>
                  )}
                  {testResults.scraping && testResults.scraping.success && (
                    <div className="mt-2 p-2 bg-blue-50 rounded">
                      <p className="text-sm text-blue-800">
                        Website scraping: {testResults.scraping.total} pages from {testResults.scraping.domain}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Badge variant="destructive">Failed</Badge>
                  <p className="text-sm text-red-600">{testResults.error}</p>
                  {testResults.suggestion && <p className="text-xs text-gray-600">{testResults.suggestion}</p>}
                  {testResults.suggestions && (
                    <ul className="text-xs text-gray-600 space-y-1">
                      {testResults.suggestions.map((suggestion: string, index: number) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strategy Information */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                Paid Plan Benefits
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Direct CMS API access</li>
                <li>• Real-time content sync</li>
                <li>• Complete metadata backup</li>
                <li>• Automated change detection</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                Free Tier Strategy
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• HubSpot CRM data backup</li>
                <li>• Website content scraping</li>
                <li>• Sitemap-based discovery</li>
                <li>• Combined comprehensive coverage</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
