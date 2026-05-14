"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Calendar, Users, Briefcase, Settings, LayoutDashboard,
  Clock, Layers, LifeBuoy, Mail, TrendingUp, MapPin, Zap, X, ChevronRight, LogOut,
  ShieldCheck, MessageSquare
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Language, translations } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'

const navItemsBase = [
  { id: 'dashboard',     es: 'Vista General',  it: 'Panoramica',   en: 'Overview',   href: '/dashboard',              icon: LayoutDashboard, group: 'manage' },
  { id: 'appointments',  es: 'Agenda',         it: 'Agenda',       en: 'Schedule',   href: '/dashboard/appointments', icon: Calendar,        group: 'manage' },
  { id: 'clients',       es: 'Pacientes',      it: 'Pazienti',     en: 'Patients',   href: '/dashboard/clients',      icon: Users,           group: 'manage' },
  { id: 'whatsapp-chat', es: 'Mensajes',       it: 'Messaggi',     en: 'Messages',   href: '/dashboard/whatsapp-chat',icon: MessageSquare,   group: 'manage' },
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
  userRoleProp?: string | null
}

export function Sidebar({ lang = 'es', userRoleProp }: SidebarProps) {
  const pathname = usePathname()
  const supabase = createClient()
  const [activeTenant, setActiveTenant] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(userRoleProp || null)
  const [roleLoading, setRoleLoading] = useState(!userRoleProp)
  const [showSupportModal, setShowSupportModal] = useState(false)

  const [isHovered, setIsHovered] = useState(false)
  const t = translations[lang] || translations['es']

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setRoleLoading(false); return }
      const { data: tuData } = await supabase
        .from('tenant_users')
        .select('tenant_id, role, tenants(id, name, slug, settings)')
        .eq('user_id', user.id)
        .limit(1).single()
      if (tuData) {
        setUserRole(tuData.role)
        if (tuData.tenants) setActiveTenant(tuData.tenants)
      }
      setRoleLoading(false)
    }
    fetchData()
  }, [])

  const filteredNavItems = navItemsBase.filter(item => {
    // If we're still loading the role and no prop was provided, show nothing
    if (roleLoading && !userRoleProp) return false

    if (userRole === 'professional') {
      return ['dashboard', 'appointments', 'professionals', 'settings'].includes(item.id)
    }
    if (userRole === 'secretary') {
      // Secretary sees manage section fully + services/locations (read-only), but NOT analytics or settings or dashboard
      return !['dashboard', 'analytics', 'settings'].includes(item.id)
    }
    return true
  })

  const groups = ['manage', 'configure'] as const

  const isExpanded = isHovered
  const tenantPrimary = activeTenant?.settings?.primary_color
  const tenantSecondary = activeTenant?.settings?.secondary_color

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
        <Link href={userRole === 'secretary' ? '/dashboard/appointments' : '/dashboard'} className="flex items-center gap-3 group">
          {activeTenant?.settings?.logo_url ? (
            <img 
              src={activeTenant.settings.logo_url} 
              alt={activeTenant.name} 
              className="h-8 w-8 rounded-xl object-contain bg-white shadow-spatial flex-shrink-0" 
            />
          ) : (
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 shadow-spatial flex-shrink-0">
              <Zap className="h-4 w-4 text-white fill-white" />
            </div>
          )}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-lg font-black text-on-surface tracking-tighter leading-none block font-display">
                  {activeTenant?.name || 'SchedAssist'}
                </span>
                <span className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] block">
                  {activeTenant?.name ? 'Clinic Portal' : 'Precision OS'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-10 overflow-y-auto custom-scrollbar">
        {roleLoading ? (
          <div className="space-y-10">
            {[4, 4].map((count, gi) => (
              <div key={gi} className="space-y-4">
                <div className={`px-4 h-3 w-16 bg-on-surface/[0.04] rounded animate-pulse transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`} />
                <div className="space-y-1">
                  {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                      <div className="h-5 w-5 rounded bg-on-surface/[0.04] animate-pulse flex-shrink-0" />
                      {isExpanded && <div className="h-3.5 w-24 bg-on-surface/[0.04] rounded animate-pulse" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          groups.map(group => {
          const items = filteredNavItems.filter(i => i.group === group)
          if (items.length === 0) return null
          return (
            <div key={group} className="space-y-4">
              <p className={`px-4 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.3em] font-display transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                {groupLabels[group][lang]}
              </p>
              <div className="space-y-1">
                {items.map(item => {
                  const active = pathname === item.href
                  const activeStyle = active && tenantPrimary ? { color: tenantPrimary } : undefined
                  const pillStyle = active && tenantPrimary ? { backgroundColor: tenantPrimary } : undefined
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      data-tour={`sidebar-${item.id}`}
                      className={`group flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all duration-300 ${
                        active
                          ? 'bg-primary/5 shadow-sm ring-1 ring-primary/10'
                          : 'text-on-surface/50 hover:bg-surface-container-low hover:text-on-surface'
                      }`}
                      style={active ? { color: tenantPrimary || undefined, '--tw-ring-color': tenantPrimary ? `${tenantPrimary}1A` : undefined } as React.CSSProperties : undefined}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`transition-colors duration-300 flex-shrink-0 ${active ? '' : 'text-on-surface/30 group-hover:text-on-surface/60'}`} style={activeStyle}>
                          <item.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                        </div>
                        {isExpanded && (
                          <motion.span 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`text-[15px] font-bold tracking-tight whitespace-nowrap ${active ? 'font-black' : 'font-semibold'}`}
                            style={activeStyle}
                          >
                            {item[lang as keyof typeof item] as string}
                          </motion.span>
                        )}
                      </div>
                      {active && (
                        <motion.div layoutId="active-pill" className="h-1.5 w-1.5 rounded-full" style={pillStyle} />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })
        )}
      </nav>

      {/* Footer Section */}
      <div className="p-4 mt-auto space-y-3">
        {/* Role badge for non-admin roles */}
        {userRole && userRole !== 'tenant_admin' && isExpanded && (
          <div className={`mx-2 px-3 py-2 rounded-xl flex items-center gap-2 ${
            userRole === 'secretary'
              ? 'bg-amber-50 border border-amber-100'
              : 'bg-primary/5 border border-primary/10'
          }`}>
            <ShieldCheck className={`h-3.5 w-3.5 flex-shrink-0 ${
              userRole === 'secretary' ? 'text-amber-500' : 'text-primary'
            }`} />
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${
              userRole === 'secretary' ? 'text-amber-600' : 'text-primary'
            }`}>
              {userRole === 'secretary' ? 'Secretaria' : 'Profesional'}
            </span>
          </div>
        )}
        <div className={`flex items-center justify-between px-2 ${isExpanded ? '' : 'flex-col gap-4'}`}>
            <button 
              onClick={() => setShowSupportModal(true)}
              className="p-3 text-on-surface/40 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
            >
                <LifeBuoy className="h-5 w-5" />
            </button>
            <button 
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/login'
              }}
              className="p-3 text-on-surface/40 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
            >
                <LogOut className="h-5 w-5" />
            </button>
        </div>
      </div>

      {/* Support Modal */}
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
