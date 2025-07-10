"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Edit3, Save, RefreshCw } from "lucide-react"

interface PageEditorProps {
  userId: string
  hubspotToken: string
  sheetId?: string
}

interface PageData {
  id: string
  name: string
  slug: string
  htmlTitle: string
  metaDescription: string
  status: string
  language: string
}

export default function PageEditor({ userId, hubspotToken, sheetId }: PageEditorProps) {
  const [pages, setPages] = useState<PageData[]>([])
  const [selectedPageId, setSelectedPageId] = useState("")
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (hubspotToken) {
      fetchPages()
    }
  }, [hubspotToken])

  useEffect(() => {
    if (selectedPageId) {
      fetchPageDetails(selectedPageId)
    }
  }, [selectedPageId])

  const fetchPages = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/hubspot/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: hubspotToken }),
      })

      const data = await response.json()
      if (data.success) {
        setPages(data.pages)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Failed to fetch pages:", error)
      toast({
        title: "Error",
        description: "Failed to fetch pages",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const fetchPageDetails = async (pageId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`https://api.hubapi.com/cms/v3/pages/${pageId}`, {
        headers: {
          Authorization: `Bearer ${hubspotToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch page details")
      }

      const page = await response.json()
      setPageData({
        id: page.id,
        name: page.name || "",
        slug: page.slug || "",
        htmlTitle: page.htmlTitle || "",
        metaDescription: page.metaDescription || "",
        status: page.currentState || "PUBLISHED",
        language: page.language || "en",
      })
      setHasChanges(false)
    } catch (error) {
      console.error("Failed to fetch page details:", error)
      toast({
        title: "Error",
        description: "Failed to fetch page details",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleFieldChange = (field: keyof PageData, value: string) => {
    if (pageData) {
      setPageData({ ...pageData, [field]: value })
      setHasChanges(true)
    }
  }

  const saveChanges = async () => {
    if (!pageData || !hasChanges) return

    setSaving(true)
    try {
      const updates = {
        name: pageData.name,
        slug: pageData.slug,
        htmlTitle: pageData.htmlTitle,
        metaDescription: pageData.metaDescription,
      }

      const response = await fetch("/api/pages/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          pageId: pageData.id,
          updates,
          hubspotToken,
          sheetId,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Page Updated! ✅",
          description: data.message,
        })
        setHasChanges(false)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
    setSaving(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5" />
          Page Editor
        </CardTitle>
        <CardDescription>Edit HubSpot pages directly from this interface</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Page Selection */}
        <div className="space-y-2">
          <Label htmlFor="page-select">Select Page to Edit</Label>
          <Select value={selectedPageId} onValueChange={setSelectedPageId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a page to edit..." />
            </SelectTrigger>
            <SelectContent>
              {pages.map((page) => (
                <SelectItem key={page.id} value={page.id}>
                  {page.name} ({page.slug})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pages.length === 0 && !loading && (
            <Button onClick={fetchPages} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Load Pages
            </Button>
          )}
        </div>

        {/* Page Editor Form */}
        {pageData && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Editing: {pageData.name}</h3>
              {hasChanges && (
                <Button onClick={saveChanges} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="page-name">Page Name</Label>
                <Input
                  id="page-name"
                  value={pageData.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="page-slug">Page Slug</Label>
                <Input
                  id="page-slug"
                  value={pageData.slug}
                  onChange={(e) => handleFieldChange("slug", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="html-title">HTML Title</Label>
                <Input
                  id="html-title"
                  value={pageData.htmlTitle}
                  onChange={(e) => handleFieldChange("htmlTitle", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={pageData.language} onValueChange={(value) => handleFieldChange("language", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta-description">Meta Description</Label>
              <Textarea
                id="meta-description"
                value={pageData.metaDescription}
                onChange={(e) => handleFieldChange("metaDescription", e.target.value)}
                rows={3}
              />
            </div>

            {hasChanges && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  ⚠️ You have unsaved changes. Click "Save Changes" to update the page.
                </p>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading page data...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
