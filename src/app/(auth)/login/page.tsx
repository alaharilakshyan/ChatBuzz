import React from 'react'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Home } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex w-full relative overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Home & Theme Buttons */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-50 flex items-center gap-3">
        <Link href="/" className="p-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
          <Home className="w-5 h-5 text-black dark:text-white" />
        </Link>
        <ThemeToggle />
      </div>
      
      <div className="flex-1 flex flex-col lg:flex-row w-full h-full">
        {/* Form Side */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 z-10 bg-white dark:bg-slate-950 transition-colors duration-300">
          <div className="w-full max-w-[420px]">
            <div className="text-center space-y-2 mb-10">
              <h1 className="text-4xl font-extrabold tracking-tight text-black dark:text-white">Welcome back!</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Simplify your workflow and boost your productivity<br/>
                with <span className="font-bold text-black dark:text-white">ChatBuzz</span>. Get started for free.
              </p>
            </div>
            <LoginForm />
          </div>
        </div>

        {/* Illustration Side */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-slate-900 dark:to-slate-950 p-12 items-center justify-center relative overflow-hidden transition-colors duration-300">
          {/* Decorative blur rings */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse duration-[8s]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] animate-pulse duration-[12s]" />

          <div className="text-center absolute bottom-12 z-10">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 max-w-sm mx-auto drop-shadow-sm">
              The easiest way to chat, chill, and catch up with friends
            </h2>
          </div>

          {/* Dynamic CSS Visual Interface */}
          <div className="w-full max-w-lg aspect-square flex flex-col items-center justify-center -mt-20 relative z-10 rounded-[2.5rem] bg-slate-900/5 dark:bg-white/[0.02] border border-slate-900/10 dark:border-white/[0.05] shadow-2xl backdrop-blur-xl p-8 group">
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Outer Orbit */}
              <div className="absolute inset-0 border border-emerald-500/30 rounded-full animate-[spin_20s_linear_infinite]" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_15px_#10b981]" />
              
              {/* Inner Orbit */}
              <div className="absolute inset-8 border border-teal-500/20 rounded-full animate-[spin_12s_linear_infinite_reverse]" />
              <div className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/2 w-3 h-3 rounded-full bg-teal-400 shadow-[0_0_10px_#2dd4bf]" />

              {/* Core logo node */}
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-extrabold text-3xl shadow-[0_0_40px_rgba(16,185,129,0.3)] select-none">
                B
              </div>
            </div>
            
            <div className="mt-8 text-center space-y-2">
              <div className="font-extrabold text-lg text-slate-800 dark:text-slate-200">Express Connected</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">Self-hosted endpoints are fully live and secured using modern JWT authentication protocols.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
