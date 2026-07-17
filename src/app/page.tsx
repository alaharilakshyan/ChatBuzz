import Link from 'next/link'
import { MessageSquare, ArrowRight, Zap, TrendingUp, Network, Lock, Shield } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060907] text-slate-800 dark:text-[#dde4dd] flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-slate-900 dark:selection:text-white transition-colors duration-300">
      
      {/* Embedded Premium CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
      `}} />

      {/* Decorative Aurora glow */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-emerald-500/[0.04] dark:from-emerald-500/[0.02] via-transparent to-transparent pointer-events-none z-0" />
      <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02] rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Editorial Navigation */}
      <header className="w-full absolute top-0 left-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-slate-950 font-black" />
            </div>
            <span className="font-black text-lg tracking-tighter text-slate-900 dark:text-white">
              ChatBuzz.
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Features</a>
            <a href="#security" className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Security</a>
            <Link 
              href="/login" 
              className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/chat"
              className="bg-slate-950 hover:bg-emerald-500 text-white dark:bg-white dark:hover:bg-emerald-400 dark:text-slate-950 text-xs font-bold px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
            >
              Start Building
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex flex-col z-10">
        
        {/* Asymmetrical Hero Section */}
        <section className="max-w-7xl mx-auto px-8 min-h-screen flex items-center pt-24 pb-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center w-full">
            
            {/* Left Content (Breathable & Clean) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <h1 className="text-5xl md:text-[56px] font-black tracking-tight leading-[1.05] text-slate-900 dark:text-white animate-fade-in-up">
                Communication,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-teal-300">
                  perfected.
                </span>
              </h1>
              
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg animate-fade-in-up delay-100">
                Experience the next generation of real-time communication. Built for speed, designed with precision, and always in sync. Elevate your platform with our unified API.
              </p>
              
              <div className="flex items-center gap-4 pt-2 animate-fade-in-up delay-200">
                <Link
                  href="/chat"
                  className="bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-slate-950 font-bold px-7 py-3.5 rounded-full transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:-translate-y-0.5"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold text-slate-700 dark:text-[#dde4dd] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
                >
                  <span>Read the Docs</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right Content (Floating Interactive Elements) */}
            <div className="lg:col-span-7 relative h-[500px] w-full hidden lg:block select-none">
              
              {/* Blur Backlight */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[450px] h-[450px] rounded-full bg-emerald-500/[0.05] dark:bg-emerald-500/[0.03] blur-[90px]" />
              </div>

              {/* Floating Card 1: Real-time Status */}
              <div className="absolute top-8 right-8 w-72 bg-white dark:bg-gradient-to-br dark:from-white/[0.03] dark:to-white/[0.01] backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.05] p-5 rounded-2xl animate-fade-in-up delay-200 shadow-xl dark:shadow-2xl relative">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Real-time Sync</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase">Connected</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-800/60 rounded-full" />
                  <div className="h-2 w-1/2 bg-slate-200 dark:bg-slate-800/60 rounded-full" />
                </div>
              </div>

              {/* Floating Card 2: Interactive Chat Message */}
              <div className="absolute top-1/2 left-4 -translate-y-1/2 w-[380px] bg-white dark:bg-gradient-to-br dark:from-white/[0.03] dark:to-white/[0.01] backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.05] p-6 rounded-3xl animate-fade-in-up delay-300 z-10 shadow-2xl dark:shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                <div className="space-y-4">
                  {/* Incoming */}
                  <div className="flex flex-col gap-1 items-start">
                    <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/5 p-3.5 rounded-2xl rounded-tl-sm text-xs text-slate-800 dark:text-slate-350 leading-relaxed max-w-[85%]">
                      Did you check the latest deployment? The latency is practically zero now.
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 ml-1.5">10:42 AM</span>
                  </div>

                  {/* Outgoing */}
                  <div className="flex flex-col gap-1 items-end">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3.5 rounded-2xl rounded-tr-sm text-xs text-white dark:text-slate-950 font-bold leading-relaxed max-w-[85%] shadow-lg shadow-emerald-500/10">
                      Yes, the new architecture is incredibly fast. Great work on the integration.
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mr-1.5">10:44 AM</span>
                  </div>
                </div>
              </div>

              {/* Floating Card 3: Analytics / User Growth */}
              <div className="absolute bottom-6 right-20 w-60 bg-white dark:bg-gradient-to-br dark:from-white/[0.03] dark:to-white/[0.01] backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.05] p-5 rounded-2xl animate-fade-in-up delay-400 shadow-xl dark:shadow-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active connections</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">24,592</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">+12% this week</div>
              </div>

            </div>
          </div>
        </section>

        {/* Feature Overview Section (Asymmetrical Detail Layout) */}
        <section id="features" className="max-w-7xl mx-auto px-8 py-24 border-t border-slate-200 dark:border-white/5 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Feature Left Panel (Graphic) */}
            <div className="lg:col-span-6">
              <div className="bg-white dark:bg-gradient-to-br dark:from-white/[0.02] dark:to-white/[0.01] border border-slate-200 dark:border-white/[0.05] p-8 rounded-3xl aspect-video flex flex-col justify-between overflow-hidden relative group shadow-sm dark:shadow-none">
                <div className="absolute inset-0 bg-radial-gradient from-emerald-500/[0.01] to-transparent pointer-events-none" />
                
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">Offline First</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
                    Built for the real world. Seamless transitions between connection states without missing a single packet.
                  </p>
                </div>

                <div className="h-32 w-full mt-8 bg-slate-100/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200/50 dark:border-white/5 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute w-24 h-24 border border-emerald-500/10 rounded-full animate-ping duration-1000" />
                  <div className="absolute w-36 h-36 border border-emerald-500/[0.05] rounded-full" />
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 tracking-widest uppercase">Resilience layer active</span>
                </div>
              </div>
            </div>

            {/* Feature Right Panel (Editorial Text) */}
            <div className="lg:col-span-6 flex flex-col justify-center gap-8 lg:pl-10">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Engineered for absolute reliability.
              </h2>
              
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Global Security Layer</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                      Encrypted HttpOnly cookies separate client-side scripts from sensitive data tokens, preventing session hijack exposures.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Sub-50ms Latency</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                      Optimized web socket pipelines dynamically broadcast notifications and message updates in real time.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Editorial Footer */}
      <footer id="security" className="border-t border-slate-200 dark:border-white/5 py-12 bg-transparent mt-12">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tighter">ChatBuzz.</span>

          <div className="flex gap-8 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Twitter</a>
            <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">GitHub</a>
          </div>

          <span className="text-[11px] text-slate-450 dark:text-slate-600">
            © 2026 ChatBuzz. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  )
}
