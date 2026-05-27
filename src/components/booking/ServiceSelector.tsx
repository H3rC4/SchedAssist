"use client"
import { Stethoscope, ChevronRight, ChevronLeft, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface ServiceSelectorProps {
  services: any[]
  primaryColor: string
  locations: any[]
  selectedLocation: any
  onSelect: (serv: any) => void
  onBack: () => void
  t: any
}

export function ServiceSelector({ services, primaryColor, locations, selectedLocation, onSelect, onBack, t }: ServiceSelectorProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-[#191c1e] mb-2 tracking-tighter uppercase">{t.select_service || '¿Qué servicio necesitas?'}</h2>
          <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em]">{t.select_service_desc || 'Elige el tipo de consulta'}</p>
        </div>
        {locations.length > 1 && (
          <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-on-surface/5 hover:bg-surface transition-all flex items-center gap-1" style={{ color: primaryColor }}>
            <ChevronLeft className="h-3 w-3" /> {t.change_location || 'Cambiar Sede'}
          </button>
        )}
      </div>
      <div className="grid gap-3">
        {services.map(serv => (
          <button
            key={serv.id}
            onClick={() => onSelect(serv)}
            className="flex items-center justify-between p-5 md:p-6 rounded-xl border border-on-surface/5 bg-surface hover:border-primary/30 hover:bg-white transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-on-surface/5 transition-all group-hover:shadow-md" style={{ backgroundColor: hexToRgba(primaryColor, 0.05) }}>
                <Stethoscope className="h-5 w-5" style={{ color: primaryColor }} />
              </div>
              <div>
                <h4 className="font-black text-[#191c1e] group-hover:text-primary transition-colors">{serv.name}</h4>
                <p className="text-xs font-bold text-[#191c1e]/30 flex items-center gap-2">
                  <Clock className="h-3 w-3" /> {serv.duration_minutes} min • ${serv.price}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#191c1e]/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
    </motion.div>
  )
}
