// components/dashboard/ProfileManager.tsx
'use client'

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, UserCircle, KeyRound } from 'lucide-react'

interface ProfileManagerProps {
  user: User
}

export default function ProfileManager({ user }: ProfileManagerProps) {
  const supabase = createClient()
  const { toast } = useToast()

  const [fullName, setFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  // Populate the form with the user's current full name when the component loads
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name)
    }
  }, [user])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    })

    if (error) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Profile Updated! 🎉',
        description: 'Your full name has been successfully updated.',
      })
    }
    setIsSavingProfile(false)
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both password fields are identical.',
        variant: 'destructive',
      })
      return
    }
    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Your new password must be at least 6 characters long.',
        variant: 'destructive',
      })
      return
    }

    setIsSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      toast({
        title: 'Error updating password',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Password Updated! 🔒',
        description: 'Your password has been changed successfully.',
      })
      setNewPassword('')
      setConfirmPassword('')
    }
    setIsSavingPassword(false)
  }

  return (
    <div className="space-y-6">
      {/* Profile Information Card */}
      <Card>
        <form onSubmit={handleProfileUpdate}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal details here. Your email address cannot be changed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" value={user.email} disabled />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Profile
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Change Password Card */}
      <Card>
        <form onSubmit={handlePasswordUpdate}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Choose a new password. It must be at least 6 characters long.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSavingPassword}>
              {isSavingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
