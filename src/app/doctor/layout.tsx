"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Menu, X } from 'lucide-react'
import { ForcePasswordChangeGate } from '@/components/dashboard/ForcePasswordChangeGate'
import { NotificationBell } from '@/components/dashboard/NotificationBell'
import { NotificationDrawer } from '@/components/dashboard/NotificationDrawer'
import { usePathname } from 'next/navigation'
import { useLandingTranslation } from '@/components/LanguageContext'
import { DoctorSidebar } from '@/components/doctor/DoctorSidebar'
import { motion, AnimatePresence } from 'framer-motion'
import { Language, translations } from '@/lib/i18n'

function DoctorHeader({ profName, specialty, lang = 'es', tenantId, onMenuClick, onBellClick }: { profName: string, specialty: string, lang?: Language; tenantId?: string; onMenuClick: () => void; onBellClick: () => void }) {
  const supabase = createClient()
  const t = translations[lang] || translations['es']

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="flex h-14 items-center justify-between px-4 md:px-6 flex-shrink-0 bg-surface z-40 relative border-b border-on-surface/5">
      {/* Left: Mobile menu + Doctor name */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-on-surface-muted hover:bg-surface-container-low transition-colors"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-black text-[10px] uppercase">
              {profName ? profName.split(' ').map(w => w[0]).join('').slice(0, 2) : 'DR'}
            </span>
          </div>
          <div className="hidden lg:block min-w-0">
            <p className="text-[14px] font-black text-on-surface leading-none truncate max-w-[150px] uppercase tracking-tighter">
              {profName || '—'}
            </p>
            <p className="text-[9px] font-bold text-on-surface-muted leading-tight mt-0.5 truncate max-w-[140px] uppercase tracking-widest">
              {specialty || 'General'}
            </p>
          </div>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">
        {tenantId && (
          <NotificationBell tenantId={tenantId} lang={lang} onClick={onBellClick} />
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest text-on-surface-muted hover:bg-surface-container-low hover:text-red-500 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t.sign_out}</span>
        </button>
      </div>
    </header>
  )
}

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { language, setLanguage } = useLandingTranslation()
  const supabase = createClient()
  const [profName, setProfName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [forcePassword, setForcePassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      // Also get tenant settings for language/colors
      const { data: tuData } = await supabase
        .from('tenant_users')
        .select('tenant_id, role, tenants(settings)')
        .eq('user_id', user.id)
        .limit(1).single()

      if (tuData?.tenants) {
        const t = tuData.tenants as any
        setTenantId(tuData.tenant_id)
        const detectedLang = (t.settings?.language as Language) || 'es'
        setLanguage(detectedLang)
        
        if (t.settings?.primary_color) {
          document.documentElement.style.setProperty('--primary', t.settings.primary_color)
        }
      }

      const { data: prof } = await supabase
        .from('professionals')
        .select('full_name, specialty, auth_password_hint')
        .eq('user_id', user.id)
        .single()

      if (!prof) { window.location.href = '/login'; return }

      setProfName(prof.full_name)
      setSpecialty(prof.specialty || '')
      if (prof.auth_password_hint) setForcePassword(true)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent animate-spin rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-surface overflow-hidden text-on-surface font-sans">
      {forcePassword && (
        <ForcePasswordChangeGate 
          lang={language} 
          onSuccess={() => setForcePassword(false)} 
        />
      )}

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
              className="fixed inset-y-0 left-0 z-[70] w-64 p-3 md:hidden"
            >
              <div className="h-full rounded-[2rem] overflow-hidden bg-surface-container-lowest shadow-spatial border border-on-surface/5">
                 <DoctorSidebar lang={language} />
              </div>
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

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0 transition-all duration-500 ease-in-out">
        <DoctorSidebar lang={language} />
      </div>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DoctorHeader 
          profName={profName} 
          specialty={specialty} 
          lang={language} 
          tenantId={tenantId}
          onMenuClick={() => setIsSidebarOpen(true)} 
          onBellClick={() => setIsNotificationDrawerOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
          {children}
        </main>
      </div>

      {/* Notification Drawer */}
      {tenantId && (
        <NotificationDrawer
          tenantId={tenantId}
          lang={language}
          isOpen={isNotificationDrawerOpen}
          onClose={() => setIsNotificationDrawerOpen(false)}
          onMarkAllRead={() => {}}
          translations={translations[language] || translations['es']}
        />
      )}
    </div>
  )
}
