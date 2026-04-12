"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Calendar, Users, Briefcase, Settings, LayoutDashboard, Clock, ChevronRight, Zap, Layers, LifeBuoy, X, Mail
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Language, translations } from '@/lib/i18n'

const navItemsBase = [
  { id: 'dashboard', es: 'Dashboard', it: 'Dashboard', en: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'General' },
  { id: 'appointments', es: 'Agenda', it: 'Agenda', en: 'Schedule', href: '/dashboard/appointments', icon: Calendar, category: 'Operativo' },
  { id: 'professionals', es: 'Staff', it: 'Personale', en: 'Staff', href: '/dashboard/professionals', icon: Briefcase, category: 'Operativo' },
  { id: 'services', es: 'Servicios', it: 'Servizi', en: 'Services', href: '/dashboard/services', icon: Layers, category: 'Operativo' },
  { id: 'clients', es: 'Pacientes', it: 'Pazienti', en: 'Patients', href: '/dashboard/clients', icon: Users, category: 'Operativo' },
  { id: 'whatsapp', es: 'WhatsApp', it: 'WhatsApp', en: 'WhatsApp', href: '/dashboard/whatsapp', icon: Zap, category: 'Configuración' },
  { id: 'settings', es: 'Ajustes', it: 'Impostazioni', en: 'Settings', href: '/dashboard/settings', icon: Settings, category: 'Sistema' },
  { id: 'support', es: 'Soporte', it: 'Supporto', en: 'Support', href: 'mailto:support@schedassist.com', icon: LifeBuoy, category: 'Sistema' },
]

const categories = {
  General: { es: 'General', it: 'Generale', en: 'General' },
  Operativo: { es: 'Operativo', it: 'Operativo', en: 'Operations' },
  Configuración: { es: 'Configuración', it: 'Configurazione', en: 'Configuration' },
  Sistema: { es: 'Sistema', it: 'Sistema', en: 'System' }
}

const UI_TEXT = {
  activeCenter: { es: 'Centro Activo', it: 'Centro Attivo', en: 'Active Center' },
  loading: { es: 'Cargando...', it: 'Caricamento...', en: 'Loading...' },
  logout: { es: 'Cerrar Sesión', it: 'Disconnetti', en: 'Sign Out' }
}

interface SidebarProps {
  lang?: Language;
}

export function Sidebar({ lang = 'es' }: SidebarProps) {
  const pathname = usePathname()
  const supabase = createClient()
  const [activeTenant, setActiveTenant] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showSupportModal, setShowSupportModal] = useState(false)

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
        if (tuData.tenants) {
          setActiveTenant(tuData.tenants)
        }
      }
    }
    fetchData()
  }, [])

  const t = translations[lang] || translations['es']

  const filteredNavItems = navItemsBase.filter(item => {
    if (userRole === 'professional') {
      return ['dashboard', 'appointments', 'professionals', 'support'].includes(item.id);
    }
    return true;
  });

  return (
    <div className="flex h-full w-72 flex-col bg-slate-950/80 dark:bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] relative overflow-hidden transition-all duration-500 shadow-2xl shadow-black/20">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[40%] bg-indigo-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[-20%] w-[60%] h-[40%] bg-amber-500/10 rounded-full blur-[80px]" />
      </div>

      {/* Logo Container */}
      <div className="relative z-10 flex h-24 items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Zap className="h-6 w-6 text-slate-900 fill-slate-900/80" />
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tight uppercase">SCHED<span className="text-amber-500">ASSIST</span></span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] block mt-0.5">Premium SaaS</span>
          </div>
        </div>
      </div>



      {/* Navigation */}
      <nav className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-8 custom-scrollbar">
        {Object.keys(categories).map(catKey => {
          const category = categories[catKey as keyof typeof categories]
          return (
            <div key={catKey} className="space-y-1">
              <p className="px-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4">
                {category[lang]}
              </p>
              {filteredNavItems.filter(i => i.category === catKey).map(item => {
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
                    className={`group flex items-center gap-4 rounded-[1.5rem] px-5 py-4 text-sm font-bold transition-all duration-300 relative
                      ${active 
                        ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <item.icon className={`h-5 w-5 transition-colors ${active ? 'text-slate-900' : 'text-slate-500 group-hover:text-white'}`} />
                    <span className="tracking-tight">{item[lang as keyof typeof item] as string}</span>
                    {active && (
                       <ChevronRight className="h-4 w-4 ml-auto text-slate-900/50" />
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>
 
      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" onClick={() => setShowSupportModal(false)}>
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-500" />
          <div 
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600" />
            <div className="p-10 text-center">
              <div className="h-20 w-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <LifeBuoy className="h-10 w-10 text-amber-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{t.support_title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">{t.support_description}</p>
              <div className="space-y-4 text-left">
                <a href={`mailto:${t.support_email}`} className="flex items-center gap-4 p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-amber-500/50 transition-all group">
                  <div className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                    <Mail className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'es' ? 'Email de Soporte' : lang === 'it' ? 'Email di Supporto' : 'Support Email'}</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors uppercase tracking-tight">{t.support_email}</p>
                  </div>
                </a>
                <div className="flex items-center gap-4 p-5 rounded-3xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10">
                  <div className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest">{lang === 'es' ? 'Disponibilidad' : lang === 'it' ? 'Disponibilità' : 'Availability'}</p>
                    <p className="text-xs font-black text-amber-700 dark:text-amber-400 tracking-tight">{t.support_hours}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowSupportModal(false)}
                className="mt-8 w-full py-5 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                {t.cancel || (lang === 'it' ? 'Chiudi' : 'Cerrar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
