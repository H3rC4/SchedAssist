"use client"
import { MapPin } from 'lucide-react'
import { hexToRgba } from '@/lib/utils'

interface BookingHeaderProps {
  tenant: any
  primaryColor: string
  secondaryColor: string
  t: any
}

export function BookingHeader({ tenant, primaryColor, secondaryColor, t }: BookingHeaderProps) {
  return (
    <header className="relative z-30 border-b border-on-surface/5 bg-white/80 backdrop-blur-xl">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {tenant.settings?.logo_url ? (
            <img src={tenant.settings.logo_url} alt={tenant.name} className="h-10 w-auto object-contain" />
          ) : (
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black shadow-lg" style={{ backgroundColor: primaryColor }}>
              {tenant.name[0]}
            </div>
          )}
          <h1 className="text-lg font-black text-[#191c1e] truncate max-w-[200px] sm:max-w-md tracking-tight">
            {tenant.name}
          </h1>
        </div>
        <div className="flex items-center gap-2 border px-3 py-1.5 rounded-full backdrop-blur-md" style={{ borderColor: hexToRgba(primaryColor, 0.1), backgroundColor: hexToRgba(primaryColor, 0.03) }}>
           <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: secondaryColor }} />
           <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>{t.portal_title || 'Portal de Citas'}</span>
        </div>
      </div>
    </header>
  )
}