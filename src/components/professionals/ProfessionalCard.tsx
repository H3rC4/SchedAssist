"use client"

import { Clock, ArrowRight } from 'lucide-react'
import { Professional } from '@/hooks/useProfessionals'

interface ProfessionalCardProps {
  professional: Professional;
  onClick: () => void;
}

export function ProfessionalCard({ professional, onClick }: ProfessionalCardProps) {
  const activeDays = (professional.availability_rules || []).filter(r => r.active).length

  return (
    <button 
      onClick={onClick}
      className="w-full text-left bg-surface-container-lowest rounded-[2rem] p-6 shadow-spatial hover:shadow-float transition-all group relative overflow-hidden flex flex-col justify-between h-full min-h-[260px]"
    >
      {/* STATUS INDICATOR */}
      <div className={`absolute top-6 right-6 h-2 w-2 rounded-full ${professional.active ? 'bg-primary' : 'bg-slate-200'}`} />

      <div>
        <div className="flex items-center gap-4 mb-6">
          {/* AVATAR */}
          <div className="h-14 w-14 rounded-[1.2rem] bg-surface flex items-center justify-center text-primary font-black text-lg shadow-ambient group-hover:scale-110 transition-transform duration-500">
            {professional.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-none uppercase group-hover:text-primary transition-colors">
            {professional.full_name}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            {professional.specialty || 'Especialista'}
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-full">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
            {activeDays} DÍAS LABORALES
          </span>
        </div>
        
        <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </button>
  )
}
