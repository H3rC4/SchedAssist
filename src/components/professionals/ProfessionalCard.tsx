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
      className="text-left bg-white rounded-2xl border border-gray-100 p-4 md:p-6 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all group relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 md:w-1.5 h-full ${professional.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
      <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
        <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg shadow-primary-200 flex-shrink-0">
          {professional.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm md:text-base font-bold text-gray-900 truncate">{professional.full_name}</p>
          <p className="text-[10px] md:text-xs text-primary-600 font-medium uppercase tracking-wider">{professional.specialty || 'General'}</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-50">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-[10px] md:text-xs text-gray-500 font-medium">
            {activeDays} días laborales
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
      </div>
    </button>
  )
}
