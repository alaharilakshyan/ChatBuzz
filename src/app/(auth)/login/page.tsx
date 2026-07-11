import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
        <div className="hidden lg:flex w-1/2 bg-[#F8FAFC] dark:bg-slate-950 p-12 items-center justify-center relative transition-colors duration-300">
          <div className="text-center absolute bottom-12 z-10">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 max-w-sm mx-auto drop-shadow-sm">
              The easiest way to chat, chill, and catch up with friends
            </h2>
          </div>
          {/* Illustration Container */}
          <div className="w-full max-w-lg aspect-square flex items-center justify-center -mt-20 overflow-hidden rounded-[2rem] shadow-2xl border border-slate-200/50 dark:border-slate-800/50">
             <Image 
               src="https://ejgsaymsxqzvcrjpfego.supabase.co/storage/v1/object/public/branding/login-illustration.jpg" 
               alt="ChatBuzz connect illustration" 
               width={512} 
               height={512} 
               priority
               className="w-full h-full object-cover" 
             />
          </div>
        </div>
      </div>
    </div>
  )
}
