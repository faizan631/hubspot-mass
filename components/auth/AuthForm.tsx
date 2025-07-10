"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Mail, Lock, User, ArrowRight, Loader2, Zap, CheckCircle, AlertTriangle } from "lucide-react"

export default function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const { toast } = useToast()

  const supabase = createClient()

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Clear any existing session first to avoid PKCE conflicts
      await supabase.auth.signOut()

      // Use the callback URL that matches your page structure
      const redirectTo = `${window.location.origin}/auth/callback`

      console.log("Sending magic link with redirect:", redirectTo)

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          data: name ? { full_name: name } : undefined,
        },
      })

      if (error) {
        console.error("Magic link error:", error)
        throw error
      }

      setMagicLinkSent(true)
      toast({
        title: "Magic Link Sent! ✨",
        description: `Check your email at ${email} for a secure login link`,
      })
    } catch (error) {
      console.error("Magic link error:", error)
      toast({
        title: "Failed to Send Magic Link",
        description: error instanceof Error ? error.message : "Please check your email and try again",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: name,
          },
        },
      })

      if (error) {
        console.error("Sign up error:", error)
        throw error
      }

      console.log("Sign up result:", { user: data.user, session: data.session })

      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Check your email! 📧",
          description: `We sent a confirmation link to ${email}. Click it to activate your account.`,
        })
      } else if (data.user && data.session) {
        toast({
          title: "Welcome to Smuves! 🎉",
          description: "Your account has been created successfully.",
        })
        // Redirect to dashboard if immediately signed in
        window.location.href = "/dashboard"
      }
    } catch (error) {
      console.error("Sign up error:", error)
      toast({
        title: "Sign Up Failed",
        description: error instanceof Error ? error.message : "An error occurred during sign up",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        throw error
      }

      console.log("Sign in successful:", data.user?.email)

      toast({
        title: "Welcome back! 👋",
        description: "You've been signed in successfully.",
      })

      // Redirect to dashboard
      window.location.href = "/dashboard"
    } catch (error) {
      console.error("Sign in error:", error)
      toast({
        title: "Sign In Failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const resendMagicLink = async () => {
    setLoading(true)
    try {
      // Clear session before resending
      await supabase.auth.signOut()

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: name ? { full_name: name } : undefined,
        },
      })

      if (error) throw error

      toast({
        title: "Magic Link Resent! ✨",
        description: "Check your email again for the new login link",
      })
    } catch (error) {
      console.error("Resend error:", error)
      toast({
        title: "Failed to Resend",
        description: "Please try again in a moment",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  if (magicLinkSent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>We sent a magic link to {email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">What's next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Check your email inbox (and spam folder)</li>
              <li>• Click the secure login link</li>
              <li>• You'll be automatically signed in</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setMagicLinkSent(false)
                setEmail("")
                setName("")
              }}
              className="flex-1"
            >
              Use Different Email
            </Button>
            <Button variant="outline" onClick={resendMagicLink} disabled={loading} className="flex-1 bg-transparent">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend Link"}
            </Button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-amber-800 font-medium mb-1">Important:</p>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• Only click the most recent magic link</li>
                  <li>• Don't reuse old email links (they expire)</li>
                  <li>• Close other login tabs to avoid conflicts</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Get Started Free</CardTitle>
        <CardDescription>Create your account or sign in to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="magic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="magic" className="text-xs">
              Magic Link
            </TabsTrigger>
            <TabsTrigger value="signup" className="text-xs">
              Sign Up
            </TabsTrigger>
            <TabsTrigger value="signin" className="text-xs">
              Sign In
            </TabsTrigger>
          </TabsList>

          <TabsContent value="magic" className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-900">Recommended</span>
              </div>
              <p className="text-sm text-purple-800">
                No password needed! We'll send you a secure login link via email.
              </p>
            </div>

            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-name">Full Name (Optional)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="magic-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="magic-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="magic-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Magic Link...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Send Magic Link
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signin" className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center text-xs text-gray-500">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </div>
      </CardContent>
    </Card>
  )
}
