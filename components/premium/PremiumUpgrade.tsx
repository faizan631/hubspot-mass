"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Crown, Check, Zap, Users, Shield, Database, Calendar, Star } from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface PremiumUpgradeProps {
  user: User
}

export default function PremiumUpgrade({ user }: PremiumUpgradeProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleUpgrade = async (plan: string) => {
    setLoading(true)
    try {
      // Simulate upgrade process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Upgrade Successful! 🎉",
        description: `Welcome to ${plan}! Your premium features are now active.`,
      })
    } catch (error) {
      toast({
        title: "Upgrade Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const features = {
    free: [
      "Basic HubSpot connection",
      "Website scraping (free tier)",
      "Manual backups",
      "Basic Google Sheets export",
      "Email support",
    ],
    pro: [
      "Full HubSpot CMS API access",
      "Automated scheduled backups",
      "Advanced field configuration",
      "Team collaboration (up to 5 members)",
      "Priority support",
      "Audit logs and reporting",
      "Custom backup schedules",
      "Data validation and rollback",
    ],
    enterprise: [
      "Everything in Pro",
      "Unlimited team members",
      "Advanced security controls",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "Advanced analytics",
      "White-label options",
    ],
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="font-medium">Current Plan: Free</h3>
                <p className="text-sm text-gray-600">Upgrade to unlock premium features</p>
              </div>
            </div>
            <Badge variant="outline">Free Tier</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Free Plan */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-gray-600" />
              Free
            </CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
            <div className="text-3xl font-bold">$0</div>
            <div className="text-sm text-gray-600">Forever free</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.free.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full bg-transparent" disabled>
              Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border-blue-200 shadow-lg">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-blue-600 text-white">Most Popular</Badge>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              Pro
            </CardTitle>
            <CardDescription>For growing businesses</CardDescription>
            <div className="text-3xl font-bold">$29</div>
            <div className="text-sm text-gray-600">per month</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.pro.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button onClick={() => handleUpgrade("Pro")} disabled={loading} className="w-full">
              {loading ? "Processing..." : "Upgrade to Pro"}
            </Button>
          </CardContent>
        </Card>

        {/* Enterprise Plan */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              Enterprise
            </CardTitle>
            <CardDescription>For large organizations</CardDescription>
            <div className="text-3xl font-bold">$99</div>
            <div className="text-sm text-gray-600">per month</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.enterprise.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button onClick={() => handleUpgrade("Enterprise")} disabled={loading} variant="outline" className="w-full">
              {loading ? "Processing..." : "Contact Sales"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
          <CardDescription>See what's included in each plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Feature</th>
                  <th className="text-center py-2">Free</th>
                  <th className="text-center py-2">Pro</th>
                  <th className="text-center py-2">Enterprise</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                <tr className="border-b">
                  <td className="py-2 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    HubSpot CMS API Access
                  </td>
                  <td className="text-center py-2">❌</td>
                  <td className="text-center py-2">✅</td>
                  <td className="text-center py-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Automated Backups
                  </td>
                  <td className="text-center py-2">❌</td>
                  <td className="text-center py-2">✅</td>
                  <td className="text-center py-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Members
                  </td>
                  <td className="text-center py-2">1</td>
                  <td className="text-center py-2">5</td>
                  <td className="text-center py-2">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Advanced Security
                  </td>
                  <td className="text-center py-2">❌</td>
                  <td className="text-center py-2">✅</td>
                  <td className="text-center py-2">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Can I change plans anytime?</h4>
            <p className="text-sm text-gray-600">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">What happens to my data if I downgrade?</h4>
            <p className="text-sm text-gray-600">
              Your data remains safe. Some premium features may become unavailable, but your backups are preserved.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Do you offer refunds?</h4>
            <p className="text-sm text-gray-600">
              Yes, we offer a 30-day money-back guarantee for all paid plans. No questions asked.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
