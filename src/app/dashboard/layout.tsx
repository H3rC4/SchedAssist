'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/dashboard/Sidebar'

function DashboardHeader() {
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [tenantName, setTenantName] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')

  useEffect(() => {
    setMounted(true)
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
    <header className="flex h-20 items-center justify-between px-10 border-b border-slate-200 dark:border-white/5 flex-shrink-0">
      {/* Tenant Identity (replaces "Gestión Operativa") */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-amber-900/20 flex-shrink-0">
          <span className="text-slate-900 font-black text-sm">
            {tenantName ? tenantName.slice(0, 2).toUpperCase() : '··'}
          </span>
        </div>
        <div>
          <p className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-none">
            {tenantName || '—'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium leading-tight mt-0.5 truncate max-w-[180px]">
            {tenantEmail}
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Dark / Light Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all shadow-sm"
            title="Toggle theme"
          >
            {theme === 'dark'
              ? <Sun className="h-4.5 w-4.5 text-amber-400" />
              : <Moon className="h-4.5 w-4.5 text-slate-600" />
            }
          </button>
        )}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="h-10 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </header>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-slate-900 dark:bg-black overflow-hidden font-sans">

      {/* Sidebar Section */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area - Floating Panel Concept */}
      <div className="flex-1 flex flex-col p-4 md:p-6 bg-slate-900 dark:bg-black overflow-hidden">

        {/* The White Panel */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/5">

          <DashboardHeader />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-10">
            {children}
          </main>

          {/* Decorative Subtle Glow in Panel */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] pointer-events-none" />
        </div>
      </div>
    </div>
  )
}
