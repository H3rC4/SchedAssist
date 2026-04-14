"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Calendar, Clock, Zap } from 'lucide-react'
import { ForcePasswordChangeGate } from '@/components/dashboard/ForcePasswordChangeGate'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const pathname = usePathname()
  const [profName, setProfName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [forcePassword, setForcePassword] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

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

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 border-4 border-primary-600 border-t-transparent animate-spin rounded-full" />
      </div>
    )
  }

  const navItems = [
    { label: 'Mis Citas', href: '/doctor', icon: Calendar },
    { label: 'Mi Horario', href: '/doctor/schedule', icon: Clock },
  ]

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {forcePassword && (
        <ForcePasswordChangeGate 
          lang="es" 
          onSuccess={() => setForcePassword(false)} 
        />
      )}

      {/* Sidebar compacta */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-950 text-white p-6 gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center">
            <Zap className="h-5 w-5 text-slate-900 fill-slate-900" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight">SCHED<span className="text-amber-500">ASSIST</span></span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] block">Portal Médico</span>
          </div>
        </div>

        {/* Doctor Info */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 font-black text-lg">
              {profName.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{profName}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate">{specialty || 'General'}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-2">
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                  ${active ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut className="h-4 w-4" /> Cerrar Sesión
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        {children}
      </main>
    </div>
  )
}
