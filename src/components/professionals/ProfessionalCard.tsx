"use client"

import { Clock, ArrowRight, UserCheck, Briefcase } from 'lucide-react'
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
      className="w-full text-left bg-white rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative flex flex-col md:flex-row md:items-center justify-between border border-on-surface/5 hover:border-primary/30"
    >
      <div className="flex items-center gap-5">
        {/* AVATAR - ELEGANT CIRCLE */}
        <div className="h-14 w-14 rounded-2xl bg-on-surface/5 flex items-center justify-center text-on-surface font-black text-xl shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-500 shrink-0">
          {professional.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
             <h3 className="text-base md:text-lg font-black text-on-surface tracking-tighter uppercase group-hover:text-primary transition-colors">
               {professional.full_name}
             </h3>
             {professional.active && (
               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
             )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-on-surface/5 rounded-md">
              <Briefcase className="h-3 w-3 text-on-surface/40" />
              <span className="text-[9px] font-black text-on-surface-muted uppercase tracking-widest">
                {professional.specialty || (t.specialist || 'Specialist')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 md:mt-0 flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-on-surface/5 pt-4 md:pt-0">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[7px] font-black text-on-surface-muted uppercase tracking-[0.2em] mb-1">{t.availability || 'AVAILABILITY'}</span>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-on-surface font-black uppercase tracking-tight">
                {activeDays} {activeDays === 1 ? (t.work_day || 'DAY') : (t.work_days || 'DAYS')}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[7px] font-black text-on-surface-muted uppercase tracking-[0.2em] mb-1">{t.status || 'STATUS'}</span>
            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
              professional.active 
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                : 'bg-on-surface/10 text-on-surface-muted border-transparent'
            }`}>
              {professional.active ? (t.active_status || 'Active') : (t.inactive_status || 'Inactive')}
            </div>
          </div>
        </div>

        <div className="h-10 w-10 rounded-xl bg-on-surface/5 border border-on-surface/5 flex items-center justify-center text-on-surface-muted group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:rotate-45 transition-all duration-500">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </button>
  )
}
