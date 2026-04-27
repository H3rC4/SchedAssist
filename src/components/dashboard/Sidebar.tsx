"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Calendar, Users, Briefcase, Settings, LayoutDashboard,
  Clock, Layers, LifeBuoy, Mail, TrendingUp, MapPin, Zap, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Language, translations } from '@/lib/i18n'

const navItemsBase = [
  { id: 'dashboard',     es: 'Inicio',      it: 'Home',         en: 'Home',       href: '/dashboard',              icon: LayoutDashboard, group: 'main' },
  { id: 'appointments',  es: 'Agenda',      it: 'Agenda',       en: 'Schedule',   href: '/dashboard/appointments', icon: Calendar,        group: 'main' },
  { id: 'clients',       es: 'Pacientes',   it: 'Pazienti',     en: 'Patients',   href: '/dashboard/clients',      icon: Users,           group: 'main' },
  { id: 'professionals', es: 'Staff',       it: 'Personale',    en: 'Staff',      href: '/dashboard/professionals',icon: Briefcase,       group: 'main' },
  { id: 'services',      es: 'Servicios',   it: 'Servizi',      en: 'Services',   href: '/dashboard/services',     icon: Layers,          group: 'main' },
  { id: 'locations',     es: 'Sedes',       it: 'Sedi',         en: 'Locations',  href: '/dashboard/locations',    icon: MapPin,          group: 'main' },
  { id: 'analytics',     es: 'Analíticas',  it: 'Analitiche',   en: 'Analytics',  href: '/dashboard/analytics',    icon: TrendingUp,      group: 'main' },
  { id: 'whatsapp',      es: 'WhatsApp',    it: 'WhatsApp',     en: 'WhatsApp',   href: '/dashboard/whatsapp',     icon: Zap,             group: 'config' },
  { id: 'settings',      es: 'Ajustes',     it: 'Impostazioni', en: 'Settings',   href: '/dashboard/settings',     icon: Settings,        group: 'config' },
  { id: 'support',       es: 'Soporte',     it: 'Supporto',     en: 'Support',    href: '#',                       icon: LifeBuoy,        group: 'config' },
]

const groupLabels = {
  main:   { es: 'Principal',      it: 'Principale',    en: 'Main' },
  config: { es: 'Configuración',  it: 'Configurazione', en: 'Config' },
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
      return ['dashboard', 'appointments', 'professionals', 'settings', 'support'].includes(item.id)
    }
    return true
  })

  const groups = ['main', 'config'] as const

  return (
    <>
      {/* ── Sidebar panel ── */}
      <div className="flex h-full w-72 flex-col bg-white border-r border-border-subtle rounded-2xl overflow-hidden shadow-card">

        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border-subtle">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-white fill-white" />
          </div>
          <div>
            <span className="text-[15px] font-bold text-on-surface tracking-tight">SchedAssist</span>
            <span className="block text-[10px] font-medium text-on-surface-muted tracking-wide">Medical Platform</span>
          </div>
        </div>

        {/* Tenant pill */}
        {activeTenant && (
          <div className="mx-4 mt-4 px-4 py-3 bg-primary-light rounded-xl flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-white">
                {activeTenant.name?.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-primary truncate">{activeTenant.name}</p>
              <p className="text-[10px] text-primary/60 font-medium">
                {lang === 'es' ? 'Centro Activo' : lang === 'it' ? 'Centro Attivo' : 'Active Center'}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
          {groups.map(group => {
            const items = filteredNavItems.filter(i => i.group === group)
            if (items.length === 0) return null
            return (
              <div key={group}>
                <p className="px-3 mb-1.5 text-[10px] font-semibold text-on-surface-subtle uppercase tracking-widest">
                  {groupLabels[group][lang]}
                </p>
                <div className="space-y-0.5">
                  {items.map(item => {
                    const active = pathname === item.href
                    return (
                      <Link
                        key={item.id}
                        id={`tour-${item.id}`}
                        href={item.id === 'support' ? '#' : item.href}
                        onClick={(e) => {
                          if (item.id === 'support') {
                            e.preventDefault()
                            setShowSupportModal(true)
                          }
                        }}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                          active
                            ? 'bg-primary text-white'
                            : 'text-on-surface-muted hover:bg-surface-container-low hover:text-on-surface'
                        }`}
                      >
                        <item.icon className={`h-[18px] w-[18px] flex-shrink-0 transition-colors ${
                          active ? 'text-white' : 'text-on-surface-subtle group-hover:text-on-surface'
                        }`} />
                        <span className="tracking-tight">{item[lang as keyof typeof item] as string}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          onClick={() => setShowSupportModal(false)}
        >
          <div className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm animate-fade-in" />
          <div
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-modal overflow-hidden animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Teal accent bar */}
            <div className="h-1.5 bg-primary w-full" />
            <div className="p-8">
              <button
                onClick={() => setShowSupportModal(false)}
                className="absolute top-5 right-5 p-1.5 rounded-lg text-on-surface-muted hover:bg-surface-container-low transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="h-14 w-14 rounded-2xl bg-primary-light flex items-center justify-center mb-5">
                <LifeBuoy className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-1">{t.support_title}</h3>
              <p className="text-sm text-on-surface-muted mb-6 leading-relaxed">{t.support_description}</p>

              <div className="space-y-3">
                <a
                  href={`mailto:${t.support_email}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-primary-light transition-colors group"
                >
                  <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shadow-card flex-shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-on-surface-subtle uppercase tracking-widest">
                      {lang === 'es' ? 'Email de Soporte' : lang === 'it' ? 'Email di Supporto' : 'Support Email'}
                    </p>
                    <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                      {t.support_email}
                    </p>
                  </div>
                </a>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-success-light">
                  <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shadow-card flex-shrink-0">
                    <Clock className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-success/70 uppercase tracking-widest">
                      {lang === 'es' ? 'Disponibilidad' : lang === 'it' ? 'Disponibilità' : 'Availability'}
                    </p>
                    <p className="text-sm font-semibold text-success">{t.support_hours}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowSupportModal(false)}
                className="mt-6 w-full py-3 rounded-xl bg-on-surface text-white text-sm font-semibold hover:bg-primary transition-colors"
              >
                {t.cancel || (lang === 'it' ? 'Chiudi' : 'Cerrar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
