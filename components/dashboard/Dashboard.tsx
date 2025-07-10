"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut } from "lucide-react";
import GoogleConnection from "./GoogleConnection";
import HubSpotConnection from "./HubSpotConnection";
import PageSync from "./PageSync";
import SyncHistory from "./SyncHistory";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [hubspotConnected, setHubspotConnected] = useState(false);
  const [selectedSheetId, setSelectedSheetId] = useState<string>("");
  const [hubspotToken, setHubspotToken] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();
  const supabase = createClient();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      console.log("Signed out successfully");

      
      window.location.href = "/";
    }
  };

  const refreshHistory = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user.email}
              </p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>Manage your integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Badge variant={googleConnected ? "default" : "secondary"}>
                  Google Sheets:{" "}
                  {googleConnected ? "Connected" : "Not Connected"}
                </Badge>
                <Badge variant={hubspotConnected ? "default" : "secondary"}>
                  HubSpot: {hubspotConnected ? "Connected" : "Not Connected"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            <GoogleConnection
              onConnectionChange={setGoogleConnected}
              onSheetSelect={setSelectedSheetId}
            />


            <HubSpotConnection
              onConnectionChange={setHubspotConnected}
              onTokenChange={setHubspotToken}
            />
          </div>


          {googleConnected && hubspotConnected && (
            <PageSync
              userId={user.id}
              sheetId={selectedSheetId}
              hubspotToken={hubspotToken}
              onSyncComplete={refreshHistory}
            />
          )}


          <SyncHistory userId={user.id} refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  );
}
