"use client"
import { hexToRgba } from '@/lib/utils'

interface BookingWelcomeProps {
  tenant: any
  primaryColor: string
}

export function BookingWelcome({ tenant, primaryColor }: BookingWelcomeProps) {
  if (!tenant.settings?.welcome_message) return null

  return (
    <div className="text-center mb-10">
      <h2 className="text-3xl md:text-4xl font-black text-[#191c1e] tracking-tighter uppercase mb-4 leading-tight">
        {tenant.settings.welcome_message.split(' ').map((word: string, i: number) =>
          i % 2 === 1 ? <span key={i} className="italic" style={{ color: primaryColor }}>{word} </span> : word + ' '
        )}
      </h2>
      {tenant.settings?.booking_instructions && (
        <div className="p-6 bg-white rounded-2xl border border-on-surface/5 shadow-sm max-w-lg mx-auto">
          <p className="text-xs font-bold text-on-surface/40 uppercase tracking-widest leading-loose">
            {tenant.settings.booking_instructions}
          </p>
        </div>
      )}
    </div>
  )
}