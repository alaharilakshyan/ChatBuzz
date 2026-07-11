import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { PhoneCall, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CallsPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/10 dark:bg-slate-950/10">
      <Card className="w-full max-w-md rounded-[24px] border border-slate-200/50 dark:border-slate-800/50 shadow-xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-md">
        <CardHeader className="text-center space-y-2 p-8">
          <div className="mx-auto w-16 h-16 rounded-[20px] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 mb-2">
            <PhoneCall className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Voice & Video Calls
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            WebRTC audio and video call pipelines will live here (Module 6 & 7).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0 flex flex-col items-center gap-4">
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium text-center">
            This module placeholder is active and protected by route middleware guards.
          </p>
          <Link href="/chat">
            <Button className="rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md">
              Go to Chat Home
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
