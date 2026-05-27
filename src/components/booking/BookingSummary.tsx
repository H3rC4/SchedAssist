"use client"
import { User } from 'lucide-react'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface BookingSummaryProps {
  step: number
  selectedService: any
  selectedProfessional: any
  primaryColor: string
  secondaryColor: string
  t: any
}

export function BookingSummary({ step, selectedService, selectedProfessional, primaryColor, secondaryColor, t }: BookingSummaryProps) {
  if (step <= 1) return null

  const nextLabels: Record<number, string> = {
    2: t.next_professional || 'Profesional',
    3: t.next_schedule || 'Horario',
    4: t.next_data || 'Tus Datos',
    5: t.next_finish || 'Finalizar'
  }

  return (
    <div className="bg-white border border-on-surface/5 rounded-2xl p-6 shadow-card flex items-center justify-between">
      <div className="flex items-center gap-4">
         <div className="hidden sm:flex h-10 w-10 rounded-xl items-center justify-center border border-on-surface/5" style={{ backgroundColor: hexToRgba(primaryColor, 0.05) }}>
           <User className="h-5 w-5" style={{ color: primaryColor }} />
         </div>
         <div>
           <p className="text-[10px] font-black text-[#191c1e]/30 uppercase tracking-widest">{t.summary || 'Resumen'}</p>
           <p className="text-xs font-bold text-[#191c1e]/60 truncate max-w-[200px]">
             {selectedService?.name}{selectedProfessional ? ` con ${selectedProfessional.full_name}` : ''}
           </p>
         </div>
      </div>
      <div className="text-right">
         <p className="text-[10px] font-black text-[#191c1e]/30 uppercase tracking-widest">{t.step_of} {step} / 5</p>
         <p className="text-xs font-black" style={{ color: secondaryColor }}>{step === 5 ? t.finish || 'Finalizar' : t.next_label || 'Siguiente: ' + (nextLabels[step] || '')}</p>
      </div>
    </div>
  )
}
