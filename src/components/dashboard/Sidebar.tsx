"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Calendar, Users, Briefcase, Settings, LayoutDashboard,
  Clock, Layers, LifeBuoy, Mail, TrendingUp, MapPin, Zap, X, ChevronRight, LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Language, translations } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'

const navItemsBase = [
  { id: 'dashboard',     es: 'Overview',      it: 'Overview',     en: 'Overview',   href: '/dashboard',              icon: LayoutDashboard, group: 'manage' },
  { id: 'appointments',  es: 'Schedule',      it: 'Schedule',     en: 'Schedule',   href: '/dashboard/appointments', icon: Calendar,        group: 'manage' },
  { id: 'clients',       es: 'Patients',      it: 'Patients',     en: 'Patients',   href: '/dashboard/clients',      icon: Users,           group: 'manage' },
  { id: 'professionals', es: 'Staff',         it: 'Staff',        en: 'Staff',      href: '/dashboard/professionals',icon: Briefcase,       group: 'manage' },
  { id: 'services',      es: 'Services',      it: 'Services',     en: 'Services',   href: '/dashboard/services',     icon: Layers,          group: 'configure' },
  { id: 'locations',     es: 'Locations',     it: 'Locations',    en: 'Locations',  href: '/dashboard/locations',    icon: MapPin,          group: 'configure' },
  { id: 'analytics',     es: 'Insights',      it: 'Insights',     en: 'Insights',   href: '/dashboard/analytics',    icon: TrendingUp,      group: 'configure' },
  { id: 'settings',      es: 'System',        it: 'System',       en: 'System',     href: '/dashboard/settings',     icon: Settings,        group: 'configure' },
]

const groupLabels = {
  manage:   { es: 'Gestión',      it: 'Gestione',    en: 'Manage' },
  configure: { es: 'Configuración', it: 'Configuración', en: 'Configure' },
}

interface SidebarProps {
  lang?: Language
}

export function Sidebar({ lang = 'es' }: SidebarProps) {
  const pathname = usePathname()
  const supabase = createClient()
  const [activeTenant, setActiveTenant] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showSupportModal, setShowSupportModal] = useState(false)

  const t = translations[lang] || translations['es']

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: tuData } = await supabase
        .from('tenant_users')
        .select('tenant_id, role, tenants(id, name, slug, settings)')
        .eq('user_id', user.id)
        .limit(1).single()
      if (tuData) {
        setUserRole(tuData.role)
        if (tuData.tenants) setActiveTenant(tuData.tenants)
      }
    }
    fetchData()
  }, [])

  const filteredNavItems = navItemsBase.filter(item => {
    if (userRole === 'professional') {
      return ['dashboard', 'appointments', 'professionals', 'settings'].includes(item.id)
    }
    return true
  })

  const groups = ['manage', 'configure'] as const

  return (
    <div className="flex h-full w-[280px] flex-col bg-surface-container-lowest relative z-50">
      {/* Brand Section */}
      <div className="p-8 pb-10">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 shadow-spatial">
            <Zap className="h-5 w-5 text-white fill-white" />
          </div>
          <div>
            <span className="text-xl font-black text-on-surface tracking-tighter leading-none block font-display">SchedAssist</span>
            <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mt-0.5 block">Precision OS</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-10 overflow-y-auto custom-scrollbar">
        {groups.map(group => {
          const items = filteredNavItems.filter(i => i.group === group)
          if (items.length === 0) return null
          return (
            <div key={group} className="space-y-4">
              <p className="px-4 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.3em] font-display">
                {groupLabels[group][lang]}
              </p>
              <div className="space-y-1">
                {items.map(item => {
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`group flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all duration-300 ${
                        active
                          ? 'bg-primary/5 text-primary shadow-sm ring-1 ring-primary/10'
                          : 'text-on-surface/50 hover:bg-surface-container-low hover:text-on-surface'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`transition-colors duration-300 ${active ? 'text-primary' : 'text-on-surface/30 group-hover:text-on-surface/60'}`}>
                          <item.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                        </div>
                        <span className={`text-[15px] font-bold tracking-tight ${active ? 'font-black' : 'font-semibold'}`}>
                          {item[lang as keyof typeof item] as string}
                        </span>
                      </div>
                      {active && (
                        <motion.div layoutId="active-pill" className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Tenant / Profile Footer */}
      <div className="p-4 mt-auto">
        {activeTenant && (
          <div className="bg-surface-container-low rounded-3xl p-4 flex items-center gap-3 group cursor-pointer hover:bg-surface-container-high transition-colors shadow-sm">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-black text-xs">
              {activeTenant.name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-on-surface truncate tracking-tight">{activeTenant.name}</p>
              <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest truncate">{activeTenant.slug}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-on-surface/20 group-hover:text-on-surface/40 transition-colors" />
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-between px-2">
            <button 
              onClick={() => setShowSupportModal(true)}
              className="p-3 text-on-surface/40 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
            >
                <LifeBuoy className="h-5 w-5" />
            </button>
            <form action="/auth/sign-out" method="post">
                <button className="p-3 text-on-surface/40 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                    <LogOut className="h-5 w-5" />
                </button>
            </form>
        </div>
      </div>

      {/* Support Modal (Simplified / Precision Style) */}
      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowSupportModal(false)}
              className="absolute inset-0 bg-on-surface/20 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-surface-container-lowest rounded-5xl shadow-spatial p-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-16 w-16 rounded-3xl bg-primary/5 flex items-center justify-center mb-8 shadow-sm">
                <LifeBuoy className="h-8 w-8 text-primary" />
              </div>
              <h3 className="precision-header text-4xl mb-4">{t.support_title}</h3>
              <p className="text-on-surface/60 font-medium mb-10 leading-relaxed">{t.support_description}</p>
              
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-4 p-5 rounded-3xl bg-surface-container-low">
                   <Mail className="h-5 w-5 text-primary" />
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em]">{lang === 'es' ? 'Contacto' : 'Contact'}</p>
                      <p className="font-bold text-on-surface">{t.support_email}</p>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => setShowSupportModal(false)}
                className="precision-button-primary w-full"
              >
                {lang === 'es' ? 'Cerrar' : 'Close'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
