"use client"
import { CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface BookingSuccessProps {
  selectedDate: Date
  selectedSlot: string | null
  primaryColor: string
  secondaryColor: string
  t: any
}

export function BookingSuccess({ selectedDate, selectedSlot, primaryColor, secondaryColor, t }: BookingSuccessProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] p-10 md:p-12 text-center shadow-card border border-on-surface/5">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border" style={{ backgroundColor: hexToRgba(secondaryColor, 0.1), borderColor: hexToRgba(secondaryColor, 0.2) }}>
        <CheckCircle2 className="h-10 w-10" style={{ color: secondaryColor }} />
      </div>
      <h2 className="text-3xl font-black text-[#191c1e] mb-3 tracking-tighter uppercase">{t.appointment_requested || 'Cita Solicitada'}</h2>
      <p className="text-sm font-bold text-[#191c1e]/40 mb-8 max-w-md mx-auto leading-relaxed">
        {t.confirmation_message || 'Hemos recibido tu solicitud para el'} <strong className="text-[#191c1e]">{format(selectedDate, "d 'de' MMMM", { locale: es })}</strong> {t.at || 'a las'} <strong className="text-[#191c1e]">{selectedSlot}</strong>. {t.confirmation_soon || 'Te enviaremos una confirmación pronto.'}
      </p>
      <button onClick={() => window.location.reload()} className="font-black uppercase tracking-[0.2em] text-xs px-10 py-4 rounded-xl transition-all active:scale-95 text-white shadow-lg" style={{ backgroundColor: secondaryColor }}>
        {t.new_appointment || 'Nueva Cita'}
      </button>
    </motion.div>
  )
}
