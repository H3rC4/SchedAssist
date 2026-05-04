"use client"

import { Clock, ArrowRight } from 'lucide-react'
import { Professional } from '@/hooks/useProfessionals'

interface ProfessionalCardProps {
  professional: Professional;
  onClick: () => void;
  t: any;
}

export function ProfessionalCard({ professional, onClick, t }: ProfessionalCardProps) {
  const activeDays = (professional.availability_rules || []).filter(r => r.active).length

  return (
    <button 
      onClick={onClick}
      className="w-full text-left bg-surface-container-lowest rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-all group relative flex items-center justify-between border border-on-surface/5 hover:border-primary/20"
    >
      <div className="flex items-center gap-4">
        {/* AVATAR */}
        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm md:text-base shadow-sm group-hover:scale-105 transition-transform duration-300 shrink-0">
          {professional.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>

        <div className="flex flex-col">
          <h3 className="text-sm md:text-base font-black text-on-surface tracking-tight uppercase group-hover:text-primary transition-colors line-clamp-1">
            {professional.full_name}
          </h3>
          <p className="text-[9px] md:text-[10px] font-bold text-on-surface-muted uppercase tracking-widest mt-0.5 line-clamp-1">
            {professional.specialty || (t.specialist || 'Specialist')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6 shrink-0">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface rounded-full border border-on-surface/5">
          <Clock className="h-3 w-3 text-primary" />
          <span className="text-[9px] text-on-surface-muted font-black uppercase tracking-widest whitespace-nowrap">
            {activeDays} {activeDays === 1 ? (t.work_day || 'WORK DAY') : (t.work_days || 'WORK DAYS')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* STATUS INDICATOR */}
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${professional.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-300'}`} />
            <span className="hidden md:inline text-[9px] font-black uppercase tracking-widest text-on-surface-muted">
              {professional.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="h-8 w-8 rounded-full bg-surface border border-on-surface/5 flex items-center justify-center text-on-surface-muted group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </button>
  )
}
