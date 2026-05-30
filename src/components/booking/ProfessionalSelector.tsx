"use client"
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { hexToRgba } from '@/lib/utils'
import { motion } from 'framer-motion'
import { getInitials, getAvatarColor } from './ProfessionalAvatar'

interface ProfessionalSelectorProps {
  professionals: any[]
  primaryColor: string
  selectedLocation: any
  onSelect: (prof: any) => void
  onBack: () => void
  t: any
}

export function ProfessionalSelector({ professionals, primaryColor, selectedLocation, onSelect, onBack, t }: ProfessionalSelectorProps) {
  const filtered = professionals.filter(p => !selectedLocation || !p.location_id || p.location_id === selectedLocation.id)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-[#191c1e] mb-2 tracking-tighter uppercase">
            {t.select_professional}
          </h2>
          <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em]">
            {t.select_professional_desc}
          </p>
        </div>
        <button 
          onClick={onBack} 
          className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-on-surface/5 hover:bg-surface transition-all flex items-center gap-1" 
          style={{ color: primaryColor }}
        >
          <ChevronLeft className="h-3 w-3" /> 
          {t.change_service}
        </button>
      </div>

      <div className="grid gap-3">
        {filtered.map(prof => {
          const avatarColor = getAvatarColor(prof.full_name, primaryColor)
          const initials = getInitials(prof.full_name)
          
          return (
            <button
              key={prof.id}
              onClick={() => onSelect(prof)}
              className="flex items-center justify-between p-5 md:p-6 rounded-xl border border-on-surface/5 bg-surface hover:border-primary/30 hover:bg-white transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center border border-on-surface/5 text-white font-black text-sm shadow-md transition-all group-hover:shadow-lg"
                  style={{ backgroundColor: avatarColor }}
                >
                  {initials}
                </div>
                <div>
                  <h4 className="font-black text-[#191c1e] group-hover:text-primary transition-colors">
                    {prof.full_name}
                  </h4>
                  <p className="text-xs font-bold text-[#191c1e]/30">
                    {prof.specialty || t.specialist}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[#191c1e]/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}