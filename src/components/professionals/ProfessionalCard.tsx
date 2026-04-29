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
      className="w-full text-left bg-surface-container-lowest rounded-[2.5rem] p-8 shadow-spatial hover:shadow-float transition-all group relative overflow-hidden flex flex-col justify-between h-full min-h-[320px]"
    >
      {/* STATUS INDICATOR */}
      <div className={`absolute top-8 right-8 h-3 w-3 rounded-full ${professional.active ? 'bg-primary' : 'bg-slate-200'}`} />

      <div>
        <div className="flex items-center gap-6 mb-10">
          {/* AVATAR */}
          <div className="h-20 w-20 rounded-[2rem] bg-surface flex items-center justify-center text-primary font-black text-2xl shadow-ambient group-hover:scale-110 transition-transform duration-500">
            {professional.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase group-hover:text-primary transition-colors">
            {professional.full_name}
          </h3>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">
            {professional.specialty || 'Especialista'}
          </p>
        </div>
      </div>

      <div className="mt-12 flex items-center justify-between">
        <div className="flex items-center gap-3 px-4 py-2 bg-surface rounded-full">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
            {activeDays} DÍAS LABORALES
          </span>
        </div>
        
        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
          <ArrowRight className="h-5 w-5" />
        </div>
      </div>
    </button>
  )
}
