"use client"

import { Clock, ChevronRight } from 'lucide-react'
import { Professional } from '@/hooks/useProfessionals'

interface ProfessionalCardProps {
  professional: Professional;
  onClick: () => void;
}

export function ProfessionalCard({ professional, onClick }: ProfessionalCardProps) {
  const activeDays = (professional.availability_rules || []).filter(r => r.active).length

  return (
    <button onClick={onClick}
      className="text-left bg-primary-900/40 backdrop-blur-md rounded-[2rem] border border-white/10 p-4 md:p-6 shadow-lg hover:shadow-2xl hover:border-accent-500/50 hover:bg-primary-900/60 transition-all group relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 md:w-1.5 h-full ${professional.active ? 'bg-accent-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-primary-800'}`} />
      <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
        <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-[#0B1120] border-2 border-accent-500/30 flex items-center justify-center text-white font-black text-lg md:text-xl shadow-[0_0_15px_rgba(245,158,11,0.2)] flex-shrink-0">
          {professional.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm md:text-base font-black text-white truncate tracking-tight uppercase">{professional.full_name}</p>
          <p className="text-[10px] md:text-[10px] text-accent-500 font-bold uppercase tracking-widest">{professional.specialty || 'General'}</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-white/10">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary-400" />
          <span className="text-[10px] md:text-[10px] text-primary-300 font-bold uppercase tracking-widest">
            {activeDays} días laborales
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-primary-500 group-hover:text-accent-500 transition-colors" />
      </div>
    </button>
  )
}
