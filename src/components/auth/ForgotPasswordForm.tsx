'use client'

import React, { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { resetPasswordAction } from '@/actions/auth'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft } from 'lucide-react'

export const ForgotPasswordForm = () => {
  const { toast } = useToast()
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(resetPasswordAction, null)

  useEffect(() => {
    if (state?.error) {
      toast({
        title: 'Error',
        description: state.error,
        variant: 'destructive',
      })
    } else if (state?.success) {
      toast({
        title: 'Email Sent',
        description: 'Password reset link sent to your email.',
      })
    }
  }, [state, toast])

  if (state?.success) {
    return (
      <Card className="w-full max-w-[420px] mx-auto rounded-[24px] border-0 shadow-2xl bg-white/95 dark:bg-[#1A1A1A] overflow-hidden backdrop-blur-xl">
        <CardHeader className="space-y-1 pb-4 pt-6">
          <CardTitle className="text-2xl font-bold text-center text-zinc-900 dark:text-white">Check Your Email</CardTitle>
          <CardDescription className="text-center text-zinc-500 dark:text-zinc-400 text-[15px]">
            We've sent a password reset link to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 space-y-4">
          <p className="text-[14px] text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
            Please check your email inbox (and spam folder) and click the link to reset your password.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pb-8 pt-4">
          <Button variant="ghost" asChild className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300 w-full rounded-xl h-12">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-[420px] mx-auto rounded-[24px] border-0 shadow-2xl bg-white/95 dark:bg-[#1A1A1A] overflow-hidden backdrop-blur-xl">
      <CardHeader className="space-y-1 pb-4 pt-6">
        <CardTitle className="text-2xl font-bold text-center text-zinc-900 dark:text-white">Reset Password</CardTitle>
        <CardDescription className="text-center text-zinc-500 dark:text-zinc-400 text-[15px]">
          Enter your email address and we'll send you a reset link
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="px-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300 font-semibold text-[15px]">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              disabled={isPending}
              required
              className="h-12 rounded-xl bg-zinc-50 dark:bg-[#27272A] border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500 text-[15px]"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 px-8 pb-8 pt-4">
          <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-[16px] border-0 hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
          <Button variant="ghost" asChild className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300 w-full rounded-xl h-12">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
