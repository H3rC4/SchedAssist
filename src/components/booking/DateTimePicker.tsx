"use client"
import { Calendar as CalendarIcon, ChevronLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { format, addDays, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface DateTimePickerProps {
  selectedDate: Date
  selectedSlot: string | null
  availableSlots: string[]
  isBlocked: boolean
  blockReason: string | null
  primaryColor: string
  secondaryColor: string
  onSelectDate: (date: Date) => void
  onSelectSlot: (slot: string) => void
  onBack: () => void
  onNext: () => void
  t: any
}

export function DateTimePicker({ selectedDate, selectedSlot, availableSlots, isBlocked, blockReason, primaryColor, secondaryColor, onSelectDate, onSelectSlot, onBack, onNext, t }: DateTimePickerProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col flex-1 relative z-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-[#191c1e] mb-2 tracking-tighter uppercase">{t.select_datetime || 'Fecha y Hora'}</h2>
          <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em]">{t.select_datetime_desc || '¿Cuándo te viene mejor?'}</p>
        </div>
        <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-on-surface/5 hover:bg-surface transition-all flex items-center gap-1" style={{ color: primaryColor }}>
          <ChevronLeft className="h-3 w-3" /> {t.change_professional || 'Cambiar Profesional'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
        {/* Date Selector */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-[#191c1e]/30 uppercase tracking-[0.4em] ml-1">{t.next_7_days || 'Próximos 7 días'}</p>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => {
              const date = addDays(new Date(), i)
              const isSelected = isSameDay(date, selectedDate)
              return (
                <button
                  key={i}
                  onClick={() => { onSelectDate(date); onSelectSlot('') }}
                  className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border transition-all ${
                    isSelected ? 'text-white shadow-lg' : 'border-on-surface/5 bg-surface text-[#191c1e]/40 hover:border-on-surface/10 hover:bg-white hover:text-[#191c1e]'
                  }`}
                  style={isSelected ? { backgroundColor: secondaryColor, borderColor: secondaryColor } : undefined}
                >
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{format(date, 'EEE', { locale: es })}</span>
                  <span className="text-lg font-black">{format(date, 'd')}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Time Slots */}
        <div className="space-y-4 flex flex-col">
          <p className="text-[10px] font-black text-[#191c1e]/30 uppercase tracking-[0.4em] ml-1">{t.available_slots || 'Horarios Disponibles'}</p>
          <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
            {isBlocked ? (
              <div className="col-span-3 py-10 text-center">
                <p className="text-sm font-black text-red-600 uppercase tracking-widest mb-1">{t.unavailable || 'Profesional no disponible'}</p>
                {blockReason && <p className="text-xs text-red-400/60 font-semibold">{blockReason}</p>}
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="col-span-3 py-12 text-center text-[#191c1e]/30 italic text-sm font-bold">
                {t.no_slots || 'No hay horarios disponibles para este día.'}
              </div>
            ) : (
              availableSlots.map(slot => (
                <button
                  key={slot}
                  onClick={() => onSelectSlot(slot)}
                  className={`p-3 rounded-xl border text-sm font-black transition-all ${
                    selectedSlot === slot ? 'text-white shadow-lg' : 'border-on-surface/5 bg-surface text-[#191c1e]/50 hover:border-on-surface/10 hover:bg-white hover:text-[#191c1e]'
                  }`}
                  style={selectedSlot === slot ? { backgroundColor: secondaryColor, borderColor: secondaryColor } : undefined}
                >
                  {slot}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-on-surface/5">
        <button
          disabled={!selectedSlot || isBlocked}
          onClick={onNext}
          className="w-full font-black uppercase tracking-[0.2em] text-xs py-4 rounded-xl transition-all active:scale-95 text-white shadow-lg disabled:opacity-30 disabled:pointer-events-none"
          style={{ backgroundColor: secondaryColor }}
        >
          {t.continue_final || 'Continuar al Paso Final'}
        </button>
      </div>
    </motion.div>
  )
}
