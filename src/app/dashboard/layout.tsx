"use client"

import { useEffect, useState } from 'react'
import { Language, translations } from '@/lib/i18n'
import { LogOut, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TrialBanner } from '@/components/dashboard/TrialBanner'
import { OnboardingWizard } from '@/components/dashboard/OnboardingWizard'
import { InteractiveTutorial } from '@/components/dashboard/InteractiveTutorial'
import { motion, AnimatePresence } from 'framer-motion'

function DashboardHeader({ lang = 'es', onMenuClick }: { lang?: Language; onMenuClick: () => void }) {
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [tenantName, setTenantName] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')

  const t = translations[lang] || translations['es']

  useEffect(() => {
    setMounted(true)
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setTenantEmail(user.email || '')
      const { data } = await supabase
        .from('tenant_users')
        .select('tenants(name)')
        .eq('user_id', user.id)
        .limit(1).single()
      if (data?.tenants) setTenantName((data.tenants as any).name || '')
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="flex h-16 md:h-20 items-center justify-between px-4 md:px-10 border-b border-slate-200 dark:border-white/5 flex-shrink-0">
      {/* Menu / Tenant Identity */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl md:rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-amber-900/20 flex-shrink-0">
            <span className="text-slate-900 font-black text-xs md:text-sm">
              {tenantName ? tenantName.slice(0, 2).toUpperCase() : '··'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm md:text-base font-black text-slate-900 dark:text-white tracking-tight leading-none truncate max-w-[120px] md:max-w-none">
              {tenantName || '—'}
            </p>
            <p className="hidden xs:block text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-medium leading-tight mt-0.5 truncate max-w-[140px] md:max-w-[180px]">
              {tenantEmail}
            </p>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="h-9 md:h-10 px-3 md:px-5 rounded-xl md:rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300 transition-all"
        >
          <LogOut className="h-3.5 w-3.5 md:h-4 w-4" />
          <span className="hidden sm:inline">{t.sign_out}</span>
        </button>
      </div>
    </header>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [tenantInfo, setTenantInfo] = useState<{ id: string; status: string; trial_ends_at: string | null; settings: any; lang: Language } | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    async function loadStatus() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data } = await supabase
        .from('tenant_users')
        .select('tenant_id, tenants(id, subscription_status, trial_ends_at, settings)')
        .eq('user_id', user.id)
        .limit(1).single()
      
      if (data?.tenants) {
        const t = data.tenants as any
        setTenantInfo({
          id: t.id,
          status: t.subscription_status,
          trial_ends_at: t.trial_ends_at,
          settings: t.settings || {},
          lang: (t.settings?.language as Language) || 'es'
        })
      } else {
        window.location.href = '/register/clinic'
      }
    }
    loadStatus()
  }, [])

  function handleOnboardingComplete() {
    setTenantInfo(prev => prev ? {
      ...prev,
      settings: { ...prev.settings, onboarding_completed: true }
    } : null)
  }

  function handleTutorialComplete() {
    setTenantInfo(prev => prev ? {
      ...prev,
      settings: { ...prev.settings, tutorial_completed: true }
    } : null)
  }

  return (
    <div className="flex h-screen bg-slate-900 dark:bg-black overflow-hidden font-sans relative">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[70] w-72 md:hidden"
            >
              <Sidebar lang={tenantInfo?.lang} />
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-6 right-[-3rem] h-10 w-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-2xl text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Onboarding Wizard Gate */}
      {tenantInfo && !tenantInfo.settings?.onboarding_completed && (
        <OnboardingWizard 
          tenantId={tenantInfo.id} 
          lang={tenantInfo.lang} 
          onComplete={handleOnboardingComplete} 
        />
      )}

      {/* Interactive Tutorial Tooltips */}
      {tenantInfo && tenantInfo.settings?.onboarding_completed && !tenantInfo.settings?.tutorial_completed && (
        <InteractiveTutorial 
          tenantId={tenantInfo.id} 
          lang={tenantInfo.lang}
          onComplete={handleTutorialComplete} 
        />
      )}

      {/* Desktop Sidebar Section */}
      <div className="hidden md:flex flex-shrink-0 p-4 md:p-6 pr-0">
        <Sidebar lang={tenantInfo?.lang} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-2 md:p-6 bg-slate-900 dark:bg-black overflow-hidden w-full">

        {/* The White Panel */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/5">

          {tenantInfo && (
            <TrialBanner 
              status={tenantInfo.status} 
              trialEndsAt={tenantInfo.trial_ends_at} 
              lang={tenantInfo.lang}
            />
          )}

          <DashboardHeader 
            lang={tenantInfo?.lang} 
            onMenuClick={() => setIsSidebarOpen(true)}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar relative z-10">
            {children}
          </main>

          {/* Decorative Subtle Glow in Panel */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] pointer-events-none" />
        </div>
      </div>
    </div>
  )
}
