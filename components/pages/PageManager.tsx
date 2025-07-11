"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Globe,
  Search,
  RefreshCw,
  ExternalLink,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface PageManagerProps {
  user: User;
  userSettings: any;
}

interface HubSpotPage {
  id: string;
  name: string;
  url: string;
  htmlTitle: string;
  metaDescription: string;
  slug: string;
  state: string;
  createdAt: string;
  updatedAt: string;
}

export default function PageManager({ user, userSettings }: PageManagerProps) {
  const [pages, setPages] = useState<HubSpotPage[]>([]);
  const [filteredPages, setFilteredPages] = useState<HubSpotPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const connectionType = userSettings?.hubspot_connection_type;
  const isPaidConnection = connectionType === "paid";

  useEffect(() => {
    loadPages();
  }, [userSettings]);

  useEffect(() => {
    const filtered = pages.filter(
      (page) =>
        page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.htmlTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPages(filtered);
  }, [pages, searchTerm]);

  const loadPages = async () => {
    if (!userSettings?.hubspot_token_encrypted) {
      setLoading(false);
      return;
    }

    try {
      const endpoint = isPaidConnection
        ? "/api/hubspot/pages"
        : "/api/hubspot/free-tier-pages";

      const response = await fetch("/api/hubspot/pages", {
        method: "POST",
        body: JSON.stringify({
          hubspotToken: userSettings.hubspot_token_encrypted,
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (data.pages) {
          setPages(data.pages);
        } else if (data.breakdown) {
          // Build dummy pages from breakdown info
          const dummyPages: HubSpotPage[] = [];

          const types = Object.entries(data.breakdown);
          types.forEach(([type, count], i) => {
            if (count > 0) {
              dummyPages.push({
                id: `dummy-${type}`,
                name: `${type[0].toUpperCase()}${type.slice(1)} (${count})`,
                url: "https://example.com",
                htmlTitle: `${type} data`,
                metaDescription: `This is dummy data for ${type}`,
                slug: type,
                state: "PUBLISHED",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          });

          setPages(dummyPages);
        } else {
          setPages([]);
        }
      }
    } catch (error) {
      console.error("Error loading pages:", error);
      toast({
        title: "Error Loading Pages",
        description:
          error instanceof Error ? error.message : "Failed to load pages",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const refreshPages = async () => {
    setRefreshing(true);
    await loadPages();
    setRefreshing(false);
    toast({
      title: "Pages Refreshed",
      description: `Loaded ${pages.length} pages from HubSpot`,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Type Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium">
                  {isPaidConnection ? "Full CMS Access" : "Free Tier Access"}
                </h3>
                <p className="text-sm text-gray-600">
                  {isPaidConnection
                    ? "Access to all HubSpot CMS pages via API"
                    : "View dummy pages fetched from free-tier endpoints"}
                </p>
              </div>
            </div>
            <Badge variant={isPaidConnection ? "default" : "secondary"}>
              {isPaidConnection ? "Premium" : "Free"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Search and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Page Manager ({filteredPages.length} pages)
          </CardTitle>
          <CardDescription>
            {isPaidConnection
              ? "Manage your HubSpot CMS pages"
              : "View dummy pages from free-tier CRM/CMS APIs"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={refreshPages}
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pages List */}
      {filteredPages.length > 0 ? (
        <div className="grid gap-4">
          {filteredPages.map((page) => (
            <Card key={page.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{page.name}</h3>
                      {page.state && (
                        <Badge
                          variant={
                            page.state === "PUBLISHED" ? "default" : "secondary"
                          }
                        >
                          {page.state}
                        </Badge>
                      )}
                    </div>

                    {page.htmlTitle && (
                      <p className="text-sm text-gray-600">{page.htmlTitle}</p>
                    )}

                    {page.metaDescription && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {page.metaDescription}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {page.slug && <span>Slug: {page.slug}</span>}
                      {page.updatedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Updated:{" "}
                            {new Date(page.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {page.url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              {pages.length === 0 ? (
                <>
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Pages Found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {isPaidConnection
                      ? "No pages found in your HubSpot CMS"
                      : "No data returned from free-tier endpoints"}
                  </p>
                  <Button onClick={refreshPages} disabled={refreshing}>
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${
                        refreshing ? "animate-spin" : ""
                      }`}
                    />
                    Try Again
                  </Button>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Matching Pages
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your search terms
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
