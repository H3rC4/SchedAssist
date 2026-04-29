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
      className="w-full text-left bg-surface-container-lowest rounded-[1.2rem] p-4 shadow-spatial hover:shadow-float transition-all group relative overflow-hidden flex flex-col justify-between h-full min-h-[190px] border border-on-surface/5"
    >
      {/* STATUS INDICATOR */}
      <div className={`absolute top-4 right-4 h-1.5 w-1.5 rounded-full ${professional.active ? 'bg-primary' : 'bg-slate-200'}`} />

      <div>
        <div className="flex items-center gap-3 mb-4">
          {/* AVATAR */}
          <div className="h-10 w-10 rounded-[0.8rem] bg-surface flex items-center justify-center text-primary font-black text-sm shadow-ambient group-hover:scale-105 transition-transform duration-500">
            {professional.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        </div>

        <div className="space-y-0.5">
          <h3 className="text-sm font-black text-on-surface tracking-tighter leading-none uppercase group-hover:text-primary transition-colors">
            {professional.full_name}
          </h3>
          <p className="text-[7px] font-black text-on-surface-muted uppercase tracking-[0.2em]">
            {professional.specialty || 'Especialista'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-surface rounded-full">
          <Clock className="h-2.5 w-2.5 text-primary" />
          <span className="text-[7px] text-on-surface-muted font-black uppercase tracking-widest">
            {activeDays} {activeDays === 1 ? 'DÍA' : 'DÍAS'} LABORALES
          </span>
        </div>
        
        <div className="h-7 w-7 rounded-full bg-surface flex items-center justify-center text-on-surface-muted group-hover:bg-primary group-hover:text-white transition-all duration-300">
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </button>
  )
}
