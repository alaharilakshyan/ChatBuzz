'use client'

import React, { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signupAction } from '@/actions/auth'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, Mail, User, ArrowRight } from 'lucide-react'

export const RegisterForm = () => {
  const { toast } = useToast()
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(signupAction, null)

  useEffect(() => {
    if (state?.error) {
      toast({
        title: 'Registration Failed',
        description: state.error,
        variant: 'destructive',
      })
    } else if (state?.success) {
      toast({
        title: 'Registration Successful!',
        description: 'Welcome to ChatBuzz! Your account has been created.',
      })
      router.push('/chat')
      router.refresh()
    }
  }, [state, router, toast])

  return (
    <Card className="w-full max-w-[420px] mx-auto rounded-[24px] border-zinc-200 dark:border-slate-800 shadow-2xl bg-white/90 dark:bg-slate-900/90 overflow-hidden backdrop-blur-xl transition-all duration-300">
      <CardHeader className="space-y-2 pb-4 pt-6">
        <CardTitle className="text-3xl font-extrabold text-center tracking-tight bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
          Create Account
        </CardTitle>
        <CardDescription className="text-center text-zinc-500 dark:text-zinc-400 text-[14px]">
          Sign up to connect and chat with friends in real-time
        </CardDescription>
      </CardHeader>
      
      <form action={formAction}>
        <CardContent className="px-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-zinc-700 dark:text-zinc-300 font-semibold text-[14px]">
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-400" />
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="johndoe"
                disabled={isPending}
                required
                className="h-12 pl-11 rounded-xl bg-zinc-50 dark:bg-[#1C1C1E] border-zinc-200 dark:border-[#2C2C2E] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500 text-[15px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300 font-semibold text-[14px]">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                disabled={isPending}
                required
                className="h-12 pl-11 rounded-xl bg-zinc-50 dark:bg-[#1C1C1E] border-zinc-200 dark:border-[#2C2C2E] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500 text-[15px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300 font-semibold text-[14px]">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-400" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="•••••••• (min 6 chars)"
                disabled={isPending}
                required
                className="h-12 pl-11 rounded-xl bg-zinc-50 dark:bg-[#1C1C1E] border-zinc-200 dark:border-[#2C2C2E] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500 text-[15px]"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 px-8 pb-8 pt-4">
          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-[16px] border-0 transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-600/35"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              <span className="flex items-center justify-center">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </span>
            )}
          </Button>

          <p className="text-[14px] text-center text-zinc-500 dark:text-zinc-400">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
