"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Calendar, Users, Briefcase, Settings,
  LayoutDashboard, Clock, ChevronRight, Zap, Layers
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItemsBase = [
  { id: 'dashboard', es: 'Dashboard', it: 'Dashboard', en: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'General' },
  { id: 'appointments', es: 'Agenda', it: 'Agenda', en: 'Schedule', href: '/dashboard/appointments', icon: Calendar, category: 'Operativo' },
  { id: 'professionals', es: 'Staff', it: 'Personale', en: 'Staff', href: '/dashboard/professionals', icon: Briefcase, category: 'Operativo' },
  { id: 'services', es: 'Servicios', it: 'Servizi', en: 'Services', href: '/dashboard/services', icon: Layers, category: 'Operativo' },
  { id: 'clients', es: 'Pacientes', it: 'Pazienti', en: 'Patients', href: '/dashboard/clients', icon: Users, category: 'Operativo' },
  { id: 'whatsapp', es: 'WhatsApp', it: 'WhatsApp', en: 'WhatsApp', href: '/dashboard/whatsapp', icon: Zap, category: 'Configuración' },
  { id: 'settings', es: 'Ajustes', it: 'Impostazioni', en: 'Settings', href: '/dashboard/settings', icon: Settings, category: 'Sistema' },
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

export function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [activeTenant, setActiveTenant] = useState<any>(null)
  const [lang, setLang] = useState<'es' | 'it' | 'en'>('es')

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: tuData } = await supabase
        .from('tenant_users')
        .select('tenant_id, tenants(id, name, slug, settings)')
        .eq('user_id', user.id)
        .limit(1).single()
      if (tuData?.tenants) {
        const t = tuData.tenants as any
        setActiveTenant(t)
        setLang((t.settings?.language as 'en' | 'es' | 'it') || 'es')
      }
    }
    fetchData()
  }, [])

  return (
    <div className="flex h-screen w-72 flex-col bg-slate-900 dark:bg-black border-r border-slate-800 dark:border-white/10 relative overflow-hidden transition-colors duration-300">
      
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
              {navItemsBase.filter(i => i.category === catKey).map(item => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.id}
                    id={`tour-${item.id}`}
                    href={item.href}
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


    </div>
  )
}
