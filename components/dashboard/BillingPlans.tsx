// components/billing/BillingPlans.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Crown,
  Check,
  Zap,
  Users,
  Shield,
  Database,
  Calendar,
  Star,
  Loader2,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface BillingPlansProps {
  user: User;
  isPremium: boolean; // We'll pass this in to show the current plan
}

export default function BillingPlans({ user, isPremium }: BillingPlansProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async (plan: string) => {
    setLoading(true);
    // Here you would add your Stripe checkout logic
    toast({
      title: "Redirecting to checkout...",
      description: `Preparing your secure payment for the ${plan} plan.`,
    });
    // Simulate a redirect
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);
    // window.location.href = "your_stripe_checkout_url";
  };

  const features = {
    free: [
      "Basic HubSpot connection",
      "Manual backups",
      "Basic Google Sheets export",
      "Email support",
    ],
    pro: [
      "Full HubSpot CMS API access",
      "Automated scheduled backups",
      "Advanced field configuration",
      "Team collaboration (up to 5 members)",
      "Priority support & Audit logs",
    ],
    enterprise: [
      "Everything in Pro",
      "Unlimited team members",
      "Advanced security controls",
      "Custom integrations & SLA",
      "Dedicated account manager",
    ],
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Upgrade Your Plan
        </h1>
        <p className="mt-1 text-slate-500">
          Choose the plan that fits your business needs and unlock powerful
          features.
        </p>
      </div>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Free Plan */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-gray-600" />
              Free
            </CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
            <div className="text-3xl font-bold">$0</div>
            <div className="text-sm text-muted-foreground">Forever free</div>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
            <ul className="space-y-2">
              {features.free.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardContent>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              disabled={!isPremium}
            >
              {isPremium ? "Downgrade" : "Current Plan"}
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border-indigo-500 shadow-xl flex flex-col">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-indigo-600 text-white hover:bg-indigo-600">
              Most Popular
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-indigo-600" />
              Pro
            </CardTitle>
            <CardDescription>For growing businesses</CardDescription>
            <div className="text-3xl font-bold">$29</div>
            <div className="text-sm text-muted-foreground">per month</div>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
            <ul className="space-y-2">
              {features.pro.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardContent>
            <Button
              onClick={() => handleUpgrade("Pro")}
              disabled={loading || isPremium}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Processing...
                </>
              ) : isPremium ? (
                "Current Plan"
              ) : (
                "Upgrade to Pro"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Enterprise Plan */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              Enterprise
            </CardTitle>
            <CardDescription>For large organizations</CardDescription>
            <div className="text-3xl font-bold">Contact Us</div>
            <div className="text-sm text-muted-foreground">
              for custom pricing
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
            <ul className="space-y-2">
              {features.enterprise.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href="mailto:sales@example.com">Contact Sales</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
