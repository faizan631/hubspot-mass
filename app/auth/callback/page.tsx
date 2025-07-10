"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("=== AUTH CALLBACK DEBUG ===")
        console.log("Full URL:", window.location.href)
        console.log("Search params:", Object.fromEntries(searchParams.entries()))

        // Check environment variables
        console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing")
        console.log("Supabase Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing")

        const supabase = createClient()

        const code = searchParams.get("code")
        const error_code = searchParams.get("error")
        const error_description = searchParams.get("error_description")

        console.log("Auth parameters:", {
          hasCode: !!code,
          codeLength: code?.length,
          errorCode: error_code,
          errorDescription: error_description,
        })

        // Handle OAuth errors first
        if (error_code) {
          console.error("OAuth error:", error_code, error_description)
          throw new Error(error_description || error_code)
        }

        if (!code) {
          console.error("No authorization code found in URL")
          throw new Error("No authorization code received. Please try the magic link again.")
        }

        console.log("Attempting to exchange code for session...")

        // Use the newer exchangeCodeForSession method which handles PKCE automatically
        const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code)

        console.log("Exchange result:", {
          hasData: !!data,
          hasUser: !!data?.user,
          hasSession: !!data?.session,
          error: authError,
          errorMessage: authError?.message,
          errorDetails: authError,
        })

        if (authError) {
          console.error("Session exchange error:", authError)

          // Handle specific PKCE errors with better messaging
          if (authError.message?.includes("code_verifier") || authError.message?.includes("PKCE")) {
            throw new Error(
              "Authentication session expired or invalid. This can happen if you clicked an old magic link. Please request a new one.",
            )
          }

          if (authError.message?.includes("invalid_grant")) {
            throw new Error("This magic link has already been used or has expired. Please request a new one.")
          }

          // More specific error for database issues
          if (authError.message?.includes("database") || authError.message?.includes("connection")) {
            throw new Error("Database connection error. Please check your Supabase configuration and try again.")
          }

          throw new Error(`Authentication failed: ${authError.message}`)
        }

        if (data?.user && data?.session) {
          console.log("Authentication successful for:", data.user.email)
          setSuccess(true)

          // Verify the session is properly set
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
          console.log("Session verification:", {
            hasSession: !!sessionData.session,
            sessionError: sessionError,
          })

          const next = searchParams.get("next") ?? "/dashboard"
          console.log("Redirecting to:", next)

          // Small delay to show success message, then redirect
          setTimeout(() => {
            window.location.href = next
          }, 1500)
        } else {
          throw new Error("No user data received after authentication")
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Authentication failed"
        console.error("=== CALLBACK ERROR ===")
        console.error("Error:", errorMessage)
        console.error("Full error object:", err)
        console.error("Stack:", err instanceof Error ? err.stack : "No stack trace")

        setError(errorMessage)

        // Redirect to home page with error after a delay
        setTimeout(() => {
          router.replace(`/?error=${encodeURIComponent(errorMessage)}`)
        }, 3000)
      } finally {
        setLoading(false)
      }
    }

    handleCallback()
  }, [searchParams, router])

  // Rest of the component remains the same...
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Successful!</h3>
          <p className="text-sm text-gray-600 mb-4">Welcome to Smuves! Redirecting you to your dashboard...</p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Error</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>

            {/* Helpful tips based on error type */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-left">
              <h4 className="font-medium text-blue-900 text-sm mb-2">💡 Quick fixes:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                {error.includes("Database") || error.includes("connection") ? (
                  <>
                    <li>• Check your Supabase environment variables</li>
                    <li>• Verify your Supabase project is active</li>
                    <li>• Check Supabase dashboard for issues</li>
                  </>
                ) : error.includes("expired") || error.includes("code_verifier") ? (
                  <>
                    <li>• Request a fresh magic link</li>
                    <li>• Don't reuse old email links</li>
                    <li>• Check if you have multiple tabs open</li>
                  </>
                ) : (
                  <>
                    <li>• Try requesting a new magic link</li>
                    <li>• Check your internet connection</li>
                    <li>• Clear your browser cache</li>
                  </>
                )}
              </ul>
            </div>

            <p className="text-xs text-gray-500">Redirecting you back to the login page...</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Processing authentication...</p>
          <p className="text-xs text-gray-500 mt-2">Please wait while we sign you in...</p>
        </div>
      </div>
    )
  }

  return null
}
