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
  { id: 'dashboard',     es: 'Vista General',  it: 'Panoramica',   en: 'Overview',   href: '/dashboard',              icon: LayoutDashboard, group: 'manage' },
  { id: 'appointments',  es: 'Agenda',         it: 'Agenda',       en: 'Schedule',   href: '/dashboard/appointments', icon: Calendar,        group: 'manage' },
  { id: 'clients',       es: 'Pacientes',      it: 'Pazienti',     en: 'Patients',   href: '/dashboard/clients',      icon: Users,           group: 'manage' },
  { id: 'professionals', es: 'Especialistas',  it: 'Specialisti',  en: 'Staff',      href: '/dashboard/professionals',icon: Briefcase,       group: 'manage' },
  { id: 'services',      es: 'Servicios',      it: 'Servizi',      en: 'Services',   href: '/dashboard/services',     icon: Layers,          group: 'configure' },
  { id: 'locations',     es: 'Sedes',          it: 'Sedi',         en: 'Locations',  href: '/dashboard/locations',    icon: MapPin,          group: 'configure' },
  { id: 'analytics',     es: 'Estadísticas',   it: 'Statistiche',  en: 'Insights',   href: '/dashboard/analytics',    icon: TrendingUp,      group: 'configure' },
  { id: 'settings',      es: 'Sistema',        it: 'Sistema',      en: 'System',     href: '/dashboard/settings',     icon: Settings,        group: 'configure' },
]

const groupLabels = {
  manage:   { es: 'Gestión',      it: 'Gestione',    en: 'Manage' },
  configure: { es: 'Configuración', it: 'Configurazione', en: 'Configure' },
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

  const [isHovered, setIsHovered] = useState(false)
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

  const isExpanded = isHovered

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex h-full flex-col bg-white relative z-50 transition-all duration-500 ease-in-out border-r border-primary/10 ${
        isExpanded ? 'w-[280px]' : 'w-[80px]'
      }`}
    >
      {/* Brand Section */}
      <div className={`h-24 flex items-center border-b border-primary/10 transition-all duration-500 ${isExpanded ? 'px-8' : 'justify-center'}`}>
        <Link href="/dashboard" className="flex items-center gap-4 group">
          <div className="h-10 w-10 bg-primary flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-xl shadow-primary/20 flex-shrink-0 rounded-none relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Zap className="h-5 w-5 text-white fill-white relative z-10" />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-xl font-black text-[#191c1e] tracking-tighter leading-none block uppercase italic">SchedAssist</span>
                <span className="text-[9px] font-black text-primary/40 uppercase tracking-[0.4em] block mt-1">Operational OS</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-10 space-y-12 overflow-y-auto custom-scrollbar">
        {groups.map(group => {
          const items = filteredNavItems.filter(i => i.group === group)
          if (items.length === 0) return null
          return (
            <div key={group} className="space-y-6">
              <div className={`flex items-center gap-3 px-4 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                <div className="h-px w-4 bg-primary/20" />
                <p className="text-[9px] font-black text-primary/30 uppercase tracking-[0.5em]">
                  {groupLabels[group][lang]}
                </p>
              </div>
              <div className="space-y-1">
                {items.map(item => {
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`group flex items-center justify-between px-4 py-4 transition-all duration-300 relative rounded-none ${
                        active
                          ? 'bg-primary text-white shadow-xl shadow-primary/20'
                          : 'text-[#191c1e]/50 hover:bg-primary/[0.03] hover:text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`transition-colors duration-300 flex-shrink-0 ${active ? 'text-white' : 'text-primary/30 group-hover:text-primary'}`}>
                          <item.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                        </div>
                        {isExpanded && (
                          <motion.span 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`text-[10px] uppercase tracking-[0.2em] whitespace-nowrap ${active ? 'font-black' : 'font-bold'}`}
                          >
                            {item[lang as keyof typeof item] as string}
                          </motion.span>
                        )}
                      </div>
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-white/40" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-primary/10 bg-primary/[0.01]">
        <div className={`flex items-center justify-between px-2 ${isExpanded ? '' : 'flex-col gap-4'}`}>
            <button 
              onClick={() => setShowSupportModal(true)}
              className="h-10 w-10 flex items-center justify-center text-primary/40 hover:text-primary hover:bg-primary/[0.05] border border-transparent hover:border-primary/10 transition-all rounded-none"
            >
                <LifeBuoy className="h-5 w-5" />
            </button>
            <button 
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/login'
              }}
              className="h-10 w-10 flex items-center justify-center text-primary/40 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all rounded-none"
            >
                <LogOut className="h-5 w-5" />
            </button>
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
              className="absolute inset-0 bg-[#001f1c]/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="relative w-full max-w-md bg-white border border-primary/10 p-12 md:p-16 rounded-none shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none select-none">
                <LifeBuoy className="h-32 w-32 text-primary" />
              </div>

              <div className="h-16 w-16 bg-primary/[0.03] border border-primary/10 flex items-center justify-center mb-10 rounded-none">
                <LifeBuoy className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-black text-[#191c1e] tracking-tighter uppercase mb-4 italic">{t.support_title}</h3>
              <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em] mb-12 leading-loose">{t.support_description}</p>
              
              <div className="space-y-4 mb-12">
                <div className="flex items-center gap-4 p-6 bg-primary/[0.03] border border-primary/10 rounded-none relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-primary/10" />
                   <Mail className="h-5 w-5 text-primary" />
                   <div className="flex-1">
                      <p className="text-[9px] font-black text-primary/30 uppercase tracking-[0.4em]">{lang === 'es' ? 'Contacto' : 'Contact'}</p>
                      <p className="font-black text-[#191c1e] text-sm">{t.support_email}</p>
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
