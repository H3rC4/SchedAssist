"use client"
import { UserCheck, Phone, Mail, Calendar as CalendarIcon, ChevronLeft, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface ClientInfoFormProps {
  clientInfo: { firstName: string; lastName: string; email: string; phone: string; notes: string }
  selectedDate: Date
  selectedSlot: string | null
  selectedProfessional: any
  selectedService: any
  primaryColor: string
  secondaryColor: string
  bookingStatus: 'idle' | 'loading' | 'success' | 'error'
  onChange: (data: any) => void
  onBack: () => void
  onConfirm: () => void
  t: any
}

export function ClientInfoForm({ clientInfo, selectedDate, selectedSlot, selectedProfessional, selectedService, primaryColor, secondaryColor, bookingStatus, onChange, onBack, onConfirm, t }: ClientInfoFormProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-[#191c1e] mb-2 tracking-tighter uppercase">{t.your_data || 'Tus Datos'}</h2>
          <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em]">{t.your_data_desc || 'Casi hemos terminado'}</p>
        </div>
        <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-on-surface/5 hover:bg-surface transition-all flex items-center gap-1" style={{ color: primaryColor }}>
          <ChevronLeft className="h-3 w-3" /> {t.change_time || 'Cambiar Horario'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-1 flex items-center gap-1.5">
            <UserCheck className="h-3 w-3" /> {t.first_name || 'Nombre'}
          </label>
          <input type="text" placeholder={t.first_name_ph || 'Tu nombre'} value={clientInfo.firstName} onChange={e => onChange({ ...clientInfo, firstName: e.target.value })} className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-5 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-1 flex items-center gap-1.5">
            <UserCheck className="h-3 w-3" /> {t.last_name || 'Apellido'}
          </label>
          <input type="text" placeholder={t.last_name_ph || 'Tu apellido'} value={clientInfo.lastName} onChange={e => onChange({ ...clientInfo, lastName: e.target.value })} className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-5 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-1 flex items-center gap-1.5">
            <Phone className="h-3 w-3" /> {t.phone || 'Teléfono'}
          </label>
          <input type="tel" placeholder="+54 9 11 ..." value={clientInfo.phone} onChange={e => onChange({ ...clientInfo, phone: e.target.value })} className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-5 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-1 flex items-center gap-1.5">
            <Mail className="h-3 w-3" /> {t.email_optional || 'Email (Opcional)'}
          </label>
          <input type="email" placeholder="tu@email.com" value={clientInfo.email} onChange={e => onChange({ ...clientInfo, email: e.target.value })} className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-5 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none rounded-xl" />
        </div>
      </div>

      <div className="rounded-2xl p-6 border mb-8 flex items-center justify-between" style={{ backgroundColor: hexToRgba(primaryColor, 0.03), borderColor: hexToRgba(primaryColor, 0.1) }}>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center border" style={{ backgroundColor: hexToRgba(primaryColor, 0.1), borderColor: hexToRgba(primaryColor, 0.15) }}>
            <CalendarIcon className="h-6 w-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <p className="text-sm font-black text-[#191c1e]">{format(selectedDate, "d 'de' MMMM", { locale: es })}</p>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>{selectedSlot} • {selectedProfessional?.full_name}</p>
          </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black text-[#191c1e]/30 uppercase tracking-widest">{t.total || 'Total'}</p>
           <p className="text-xl font-black text-[#191c1e]">${selectedService?.price}</p>
        </div>
      </div>

      <button onClick={onConfirm} disabled={bookingStatus === 'loading' || !clientInfo.firstName || !clientInfo.phone} className="w-full font-black uppercase tracking-[0.2em] text-xs py-4 rounded-xl transition-all active:scale-95 text-white shadow-lg disabled:opacity-30 disabled:pointer-events-none" style={{ backgroundColor: secondaryColor }}>
        {bookingStatus === 'loading' ? <><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> {t.confirming || 'Confirmando...'}</> : t.confirm_booking || 'Confirmar Reserva'}
      </button>
    </motion.div>
  )
}
