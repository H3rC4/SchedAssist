"use client"

import { useEffect, useState } from 'react'
import { Language, translations } from '@/lib/i18n'
import { LogOut, Menu, X, Bell } from 'lucide-react'
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
  const [tenantName, setTenantName] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')
  const t = translations[lang] || translations['es']

  useEffect(() => {
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
    <header className="flex h-16 items-center justify-between px-6 flex-shrink-0 bg-white border-b border-border-subtle">
      {/* Left: Mobile menu + tenant name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-on-surface-muted hover:bg-surface-container-low transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-xs">
              {tenantName ? tenantName.slice(0, 2).toUpperCase() : '··'}
            </span>
          </div>
          <div className="hidden sm:block min-w-0">
            <p className="text-sm font-semibold text-on-surface leading-none truncate max-w-[140px]">
              {tenantName || '—'}
            </p>
            <p className="text-[11px] text-on-surface-muted leading-tight mt-0.5 truncate max-w-[160px]">
              {tenantEmail}
            </p>
          </div>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg text-on-surface-muted hover:bg-surface-container-low transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-surface-muted hover:bg-surface-container-low hover:text-on-surface transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{t.sign_out}</span>
        </button>
      </div>
    </header>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { setLanguage } = useLandingTranslation()
  const [tenantInfo, setTenantInfo] = useState<{
    id: string; status: string; trial_ends_at: string | null; settings: any; lang: Language
  } | null>(null)
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
          const { data: profData } = await supabase
            .from('professionals').select('auth_password_hint').eq('user_id', user.id).single()
          if (profData?.auth_password_hint) setForcePasswordChange(true)
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
    }
  }, [tenantInfo])

  function handleOnboardingComplete() {
    setTenantInfo(prev => prev ? { ...prev, settings: { ...prev.settings, onboarding_completed: true } } : null)
  }

  function handleTutorialComplete() {
    setTenantInfo(prev => prev ? { ...prev, settings: { ...prev.settings, tutorial_completed: true } } : null)
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden text-on-surface">

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-[60] bg-on-surface/30 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-[70] w-72 p-3 md:hidden"
            >
              <Sidebar lang={tenantInfo?.lang} />
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-5 right-[-2.75rem] h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-float text-on-surface-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Onboarding / Tutorial / Password gates */}
      {tenantInfo && !tenantInfo.settings?.onboarding_completed && (
        <OnboardingWizard tenantId={tenantInfo.id} lang={tenantInfo.lang} onComplete={handleOnboardingComplete} />
      )}
      {tenantInfo && tenantInfo.settings?.onboarding_completed && !tenantInfo.settings?.tutorial_completed && (
        <InteractiveTutorial tenantId={tenantInfo.id} lang={tenantInfo.lang} onComplete={handleTutorialComplete} />
      )}
      {forcePasswordChange && (
        <ForcePasswordChangeGate lang={tenantInfo?.lang} onSuccess={() => setForcePasswordChange(false)} />
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0 w-72 p-4 pr-0">
        <Sidebar lang={tenantInfo?.lang} />
      </div>

      {/* Main content column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {tenantInfo && (
          <TrialBanner status={tenantInfo.status} trialEndsAt={tenantInfo.trial_ends_at} lang={tenantInfo.lang} />
        )}
        <DashboardHeader lang={tenantInfo?.lang} onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Page scroll container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  )
}
