"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Calendar, Clock, User, Settings,
  LifeBuoy, Mail, Zap, X, LogOut
} from 'lucide-react'
import { Language, translations } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'

const navItemsBase = [
  { id: 'calendar',  es: 'Calendario',     it: 'Calendario',   en: 'Calendar',   href: '/doctor',          icon: Calendar, group: 'manage' },
  { id: 'schedule',  es: 'Horarios',       it: 'Orari',        en: 'Schedule',   href: '/doctor/schedule', icon: Clock,    group: 'manage' },
  { id: 'patients',  es: 'Pacientes',      it: 'Pazienti',     en: 'Patients',   href: '/doctor/patients', icon: User,     group: 'manage' },
  { id: 'settings',  es: 'Sistema',        it: 'Sistema',      en: 'System',     href: '/doctor/settings', icon: Settings, group: 'configure' },
]

const groupLabels = {
  manage:   { es: 'Gestión',      it: 'Gestione',    en: 'Manage' },
  configure: { es: 'Configuración', it: 'Configurazione', en: 'Configure' },
}

interface DoctorSidebarProps {
  lang?: Language
}

export function DoctorSidebar({ lang = 'es' }: DoctorSidebarProps) {
  const pathname = usePathname()
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const t = translations[lang] || translations['es']

  const groups = ['manage', 'configure'] as const
  const isExpanded = isHovered

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex h-full flex-col bg-surface-container-lowest relative z-50 transition-all duration-500 ease-in-out border-r border-on-surface/5 ${
        isExpanded ? 'w-[240px]' : 'w-[80px]'
      }`}
    >
      {/* Brand Section */}
      <div className={`h-14 flex items-center border-b border-on-surface/5 transition-all duration-500 ${isExpanded ? 'px-8' : 'justify-center'}`}>
        <Link href="/doctor" className="flex items-center gap-3 group">
          <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 shadow-spatial flex-shrink-0">
            <Zap className="h-4 w-4 text-white fill-white" />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-lg font-black text-on-surface tracking-tighter leading-none block font-display">SchedAssist</span>
                <span className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] block">{t.role_professional || 'PROFESSIONAL'}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 mt-6 space-y-10 overflow-y-auto custom-scrollbar">
        {groups.map(group => {
          const items = navItemsBase.filter(i => i.group === group)
          if (items.length === 0) return null
          return (
            <div key={group} className="space-y-4">
              <p className={`px-4 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.3em] font-display transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
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
                        <div className={`transition-colors duration-300 flex-shrink-0 ${active ? 'text-primary' : 'text-on-surface/30 group-hover:text-on-surface/60'}`}>
                          <item.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                        </div>
                        {isExpanded && (
                          <motion.span 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`text-[15px] font-bold tracking-tight whitespace-nowrap ${active ? 'font-black' : 'font-semibold'}`}
                          >
                            {item[lang as keyof typeof item] as string}
                          </motion.span>
                        )}
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

      {/* Footer Section */}
      <div className="p-4 mt-auto">
        <div className={`flex items-center justify-between px-2 ${isExpanded ? '' : 'flex-col gap-4'}`}>
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
              className="relative w-full max-w-md bg-surface-container-lowest rounded-[2rem] shadow-spatial p-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-16 w-16 rounded-[1.5rem] bg-primary/5 flex items-center justify-center mb-8 shadow-sm">
                <LifeBuoy className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-black text-on-surface uppercase tracking-tighter mb-4">{t.support_title}</h3>
              <p className="text-on-surface-muted font-bold text-sm mb-10 leading-relaxed uppercase tracking-widest">{t.support_description}</p>
              
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-surface-container-low">
                   <Mail className="h-5 w-5 text-primary" />
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em]">{lang === 'es' ? 'Contacto' : 'Contact'}</p>
                      <p className="font-bold text-on-surface">{t.support_email}</p>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => setShowSupportModal(false)}
                className="w-full bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-[1.5rem] hover:bg-primary/90 transition-all hover:shadow-lg active:scale-95"
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
