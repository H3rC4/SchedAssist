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
    <div className="flex items-center gap-3">
      <button
        onClick={handleSignOut}
        className="group flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      >
        <span>Cerrar Sesión</span>
        <LogOut className="h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors" />
      </button>
    </div>
  )
}
