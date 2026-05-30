"use client"
import { MapPin, ChevronRight } from 'lucide-react'
import { hexToRgba } from '@/lib/utils'
import { motion } from 'framer-motion'

interface LocationSelectorProps {
  locations: any[]
  primaryColor: string
  onSelect: (loc: any) => void
  t: any
}

export function LocationSelector({ locations, primaryColor, onSelect, t }: LocationSelectorProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-[#191c1e] mb-2 tracking-tighter uppercase">
          {t.select_location}
        </h2>
        <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em]">
          {t.select_location_desc}
        </p>
      </div>
      <div className="grid gap-3">
        {locations.map(loc => (
          <button
            key={loc.id}
            onClick={() => onSelect(loc)}
            className="flex items-center justify-between p-5 md:p-6 rounded-xl border border-on-surface/5 bg-surface hover:border-primary/30 hover:bg-white transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center border border-on-surface/5 transition-all group-hover:shadow-md" 
                style={{ backgroundColor: hexToRgba(primaryColor, 0.05) }}
              >
                <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
              </div>
              <div>
                <h4 className="font-black text-[#191c1e] group-hover:text-primary transition-colors">
                  {loc.name}
                </h4>
                <p className="text-xs font-bold text-[#191c1e]/30">
                  {loc.address}, {loc.city}
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