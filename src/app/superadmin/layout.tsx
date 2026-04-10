'use client';

import { ShieldCheck, LogOut, Activity, Database } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/(auth)/login/actions'
import { createClient } from '@/lib/supabase/client'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] font-sans overflow-hidden text-gray-200">
      
      {/* SuperAdmin Sidebar */}
      <div className="w-72 bg-[#111111] border-r border-[#222] flex flex-col relative z-20">
        <div className="h-20 flex items-center px-8 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <span className="text-lg font-black text-white tracking-tight leading-none block">SÚPER<span className="text-amber-500">ADMIN</span></span>
              <span className="text-[9px] font-bold text-amber-500/50 uppercase tracking-[0.2em]">Control Maestro</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          <Link href="/superadmin" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${pathname === '/superadmin' ? 'bg-[#1a1a1a] border border-[#333] text-white' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white border border-transparent'}`}>
            <Database className={`h-4 w-4 ${pathname === '/superadmin' ? 'text-amber-400' : 'text-gray-500'}`} /> Control de Clínicas
          </Link>
          <Link href="/superadmin/metrics" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${pathname === '/superadmin/metrics' ? 'bg-[#1a1a1a] border border-[#333] text-white' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white border border-transparent'}`}>
            <Activity className={`h-4 w-4 ${pathname === '/superadmin/metrics' ? 'text-amber-400' : 'text-gray-500'}`} /> Monitoreo y Métricas
          </Link>
        </nav>

        <div className="p-4 border-t border-[#222]">
           <form action={signOut}>
               <button className="flex w-full items-center gap-3 px-4 py-3 text-red-500/70 hover:bg-red-500/10 hover:text-red-500 rounded-xl font-semibold transition-all">
                  <LogOut className="h-4 w-4" /> Cerrar Sesión
               </button>
           </form>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto relative custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#0a0a0a] to-[#0a0a0a]">
        <div className="h-full w-full relative z-10">{children}</div>
      </main>
      
    </div>
  )
}
