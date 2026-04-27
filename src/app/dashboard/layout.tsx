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
import { ForcePasswordChangeGate } from '@/components/dashboard/ForcePasswordChangeGate'
import { useLandingTranslation } from '@/components/LanguageContext'

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
    <header className="flex h-16 md:h-20 items-center justify-between px-4 md:px-10 flex-shrink-0 relative z-20 bg-surface/80 backdrop-blur-xl">
      {/* Menu / Tenant Identity */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-1 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl md:rounded-2xl bg-secondary-container flex items-center justify-center shadow-lg shadow-secondary-container/20 flex-shrink-0">
            <span className="text-on-secondary-container font-black text-xs md:text-sm">
              {tenantName ? tenantName.slice(0, 2).toUpperCase() : '··'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm md:text-base font-black text-on-surface tracking-tight leading-none truncate max-w-[120px] md:max-w-none">
              {tenantName || '—'}
            </p>
            <p className="hidden xs:block text-[10px] md:text-xs text-on-surface/60 font-medium leading-tight mt-0.5 truncate max-w-[140px] md:max-w-[180px]">
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
          className="h-9 md:h-10 px-3 md:px-5 rounded-xl md:rounded-2xl bg-surface-container-highest hover:bg-surface-container-lowest flex items-center gap-2 text-xs md:text-sm font-semibold text-primary transition-all shadow-sm"
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
  const { setLanguage } = useLandingTranslation()
  const [tenantInfo, setTenantInfo] = useState<{ id: string; status: string; trial_ends_at: string | null; settings: any; lang: Language } | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [forcePasswordChange, setForcePasswordChange] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    async function loadStatus() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data } = await supabase
        .from('tenant_users')
        .select('tenant_id, role, tenants(id, subscription_status, trial_ends_at, settings)')
        .eq('user_id', user.id)
        .limit(1).single()
      
      if (data?.tenants) {
        const t = data.tenants as any
        const detectedLang = (t.settings?.language as Language) || 'es'
        setTenantInfo({
          id: t.id,
          status: t.subscription_status,
          trial_ends_at: t.trial_ends_at,
          settings: t.settings || {},
          lang: detectedLang
        })
        setLanguage(detectedLang)
        if (data.role === 'professional') {
          const { data: profData } = await supabase.from('professionals').select('auth_password_hint').eq('user_id', user.id).single()
          if (profData?.auth_password_hint) {
            setForcePasswordChange(true)
          }
        }
      } else {
        window.location.href = '/register/clinic'
      }
    }
    loadStatus()
  }, [])

  useEffect(() => {
    if (tenantInfo?.settings?.primary_color) {
      document.documentElement.style.setProperty('--primary', tenantInfo.settings.primary_color)
      // Also update related shades if possible, or just the main one
      const hex = tenantInfo.settings.primary_color
      if (hex.startsWith('#')) {
        // Simple way to inject into tailwind-like vars if needed
        // For now, our buttons use bg-primary-600 which usually maps to --primary
      }
    }
  }, [tenantInfo])

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
    <div className="flex h-screen bg-surface-container-low overflow-hidden font-sans relative text-on-surface">
      
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

      {/* Force Password Change Modal */}
      {forcePasswordChange && (
        <ForcePasswordChangeGate 
          lang={tenantInfo?.lang} 
          onSuccess={() => setForcePasswordChange(false)} 
        />
      )}

      {/* Desktop Sidebar Section */}
      <div className="hidden md:flex flex-shrink-0 p-4 md:p-6 pr-0 w-72">
        <Sidebar lang={tenantInfo?.lang} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-2 md:p-6 overflow-hidden w-full relative z-10">

        {/* The Surface Panel */}
        <div className="flex-1 flex flex-col bg-surface rounded-[2rem] md:rounded-[3rem] shadow-ambient relative overflow-hidden">

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

          {/* Decorative Subtle Glow in Panel - Kept minimal for Atmospheric Depth */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container/5 blur-[120px] pointer-events-none" />
        </div>
      </div>
    </div>
  )
}
