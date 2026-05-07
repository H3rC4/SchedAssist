"use client"

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function HeaderActions() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleSignOut}
        className="group flex items-center gap-4 bg-white border border-primary/10 px-8 py-3 transition-all hover:bg-red-50 hover:border-red-200 rounded-none relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/10 group-hover:bg-red-500 transition-colors" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#191c1e]/40 group-hover:text-red-600 transition-colors">
          TERMINATE SESSION
        </span>
        <LogOut className="h-4 w-4 text-primary/20 group-hover:text-red-500 transition-colors" />
      </button>
    </div>
  )
}
