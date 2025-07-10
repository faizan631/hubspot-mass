"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";

interface GoogleConnectionProps {
  onConnectionChange: (connected: boolean) => void;
  onSheetSelect: (sheetId: string) => void;
}

interface GoogleSheet {
  id: string;
  name: string;
}

export default function GoogleConnection({
  onConnectionChange,
  onSheetSelect,
}: GoogleConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [sheets, setSheets] = useState<GoogleSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingSheets, setFetchingSheets] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    checkGoogleConnection();


    if (searchParams.get("connected") === "google") {
      toast({
        title: "Success",
        description: "Successfully connected to Google!",
      });

      window.history.replaceState({}, "", "/dashboard");
      setTimeout(() => {
        checkGoogleConnection();
      }, 1000);
    }


    const error = searchParams.get("error");
    if (error) {
      let errorMessage = "Failed to connect to Google";
      switch (error) {
        case "oauth_error":
          errorMessage = "OAuth authorization failed";
          break;
        case "no_code":
          errorMessage = "No authorization code received";
          break;
        case "no_token":
          errorMessage = "Failed to get access token";
          break;
        case "auth_failed":
          errorMessage = "Authentication failed";
          break;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams, toast]);

  const checkGoogleConnection = async () => {
    setCheckingConnection(true);
    try {
      const response = await fetch("/api/google/check-auth");
      const data = await response.json();

      console.log("Connection check result:", data);

      if (data.connected) {
        setIsConnected(true);
        onConnectionChange(true);
        await fetchSheets();
      } else {
        setIsConnected(false);
        onConnectionChange(false);
      }
    } catch (error) {
      console.error("Error checking Google connection:", error);
      setIsConnected(false);
      onConnectionChange(false);
    }
    setCheckingConnection(false);
  };

  const connectGoogle = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/google/auth");
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error("No auth URL received");
      }
    } catch (error) {
      console.error("Connect Google error:", error);
      toast({
        title: "Error",
        description: "Failed to connect to Google",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const fetchSheets = async () => {
    setFetchingSheets(true);
    try {
      const response = await fetch("/api/google/sheets");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.sheets) {
        setSheets(data.sheets);
        console.log("Fetched sheets:", data.sheets);

        if (data.sheets.length === 0) {
          toast({
            title: "No Sheets Found",
            description:
              "No Google Sheets found in your account. Create a sheet first.",
            variant: "destructive",
          });
        }
      } else if (data.error) {
        console.error("Error fetching sheets:", data.error);
        toast({
          title: "Error",
          description:
            "Failed to fetch Google Sheets. Please try reconnecting.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching sheets:", error);
      toast({
        title: "Error",
        description:
          "Failed to fetch Google Sheets. Please check your connection.",
        variant: "destructive",
      });
    }
    setFetchingSheets(false);
  };

  const handleSheetSelect = (sheetId: string) => {
    setSelectedSheet(sheetId);
    onSheetSelect(sheetId);

    const selectedSheetName = sheets.find(
      (sheet) => sheet.id === sheetId
    )?.name;
    toast({
      title: "Sheet Selected",
      description: `Selected: ${selectedSheetName}`,
    });
  };

  const disconnect = async () => {
    try {
      await fetch("/api/google/disconnect", { method: "POST" });
      setIsConnected(false);
      setSheets([]);
      setSelectedSheet("");
      onConnectionChange(false);
      onSheetSelect("");
      toast({
        title: "Success",
        description: "Disconnected from Google",
      });
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  if (checkingConnection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Google Sheets</CardTitle>
          <CardDescription>
            Connect your Google account to access sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-2">Checking connection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Sheets</CardTitle>
        <CardDescription>
          Connect your Google account to access sheets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <Button onClick={connectGoogle} disabled={loading} className="w-full">
            {loading ? "Connecting..." : "Connect Google Account"}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-600">
                ✓ Connected to Google
              </span>
              <Button variant="outline" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            </div>

            {/* Sheet Selection - This was missing! */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select a Google Sheet to sync with:
              </label>
              {fetchingSheets ? (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  <span className="ml-2 text-sm">Loading sheets...</span>
                </div>
              ) : sheets.length > 0 ? (
                <Select value={selectedSheet} onValueChange={handleSheetSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a sheet to sync with..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sheets.map((sheet) => (
                      <SelectItem key={sheet.id} value={sheet.id}>
                        {sheet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-gray-500 py-2">
                  No Google Sheets found. Create a sheet in Google Drive first.
                </div>
              )}
            </div>

            {selectedSheet && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  ✓ Selected: {sheets.find((s) => s.id === selectedSheet)?.name}
                </p>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={fetchSheets}
              className="w-full bg-transparent"
              disabled={fetchingSheets}
            >
              {fetchingSheets ? "Refreshing..." : "Refresh Sheets"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
