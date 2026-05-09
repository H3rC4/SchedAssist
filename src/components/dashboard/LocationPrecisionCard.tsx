import { motion } from 'framer-motion'
import { Building2, Pencil, Trash2, Compass, MapPin, ArrowRight } from 'lucide-react'

interface Location {
  id: string
  name: string
  address: string
  city: string
  active: boolean
}

interface LocationPrecisionCardProps {
  location: Location
  index: number
  savedId: string | null
  onEdit: (location: Location) => void
  onDelete: (id: string) => void
  onViewSchedule?: (location: Location) => void
  t: any
}

export function LocationPrecisionCard({ location, index, savedId, onEdit, onDelete, onViewSchedule, t }: LocationPrecisionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className={`bg-white border border-primary/10 p-8 flex flex-col justify-between group relative transition-all hover:border-primary/30 hover:shadow-lg rounded-2xl ${savedId === location.id ? 'ring-1 ring-primary ring-offset-0' : ''}`}
    >
      <div className="flex items-start justify-between mb-8">
        <div className="h-14 w-14 bg-primary/[0.03] border border-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary/[0.08] rounded-xl">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(location)} 
            className="h-10 w-10 flex items-center justify-center bg-primary/[0.03] border border-primary/10 text-primary/40 hover:text-primary hover:bg-primary/10 transition-all rounded-xl"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button 
            onClick={() => onDelete(location.id)} 
            className="h-10 w-10 flex items-center justify-center bg-primary/[0.03] border border-primary/10 text-primary/40 hover:text-red-600 hover:bg-red-50 transition-all rounded-xl"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-6 bg-primary/20" />
          <p className="text-[9px] font-black text-primary/60 uppercase tracking-[0.4em]">
            {location.city || (t.global || 'Global')}
          </p>
        </div>
        <h3 className="text-2xl font-black text-[#191c1e] tracking-tighter mb-4 group-hover:text-primary transition-colors leading-tight uppercase italic">
          {location.name}
        </h3>
        <div className="space-y-3">
           <div className="flex items-start gap-3 text-[#191c1e]/50 font-bold text-[10px] uppercase tracking-[0.2em] leading-relaxed">
              <MapPin className="h-3.5 w-3.5 text-primary/40 flex-shrink-0 mt-0.5" />
              <span>{location.address || (t.address_not_specified || 'Address not specified')}</span>
           </div>
        </div>
      </div>

      <div className="mt-10 pt-8 border-t border-primary/10 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${location.active ? 'bg-primary shadow-[0_0_8px_rgba(0,92,85,0.4)]' : 'bg-primary/20'}`} />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/60">
               {location.active ? (t.active_operation || 'Active Operation') : (t.inactive || 'Inactive')}
            </span>
         </div>
          <button
            onClick={() => onViewSchedule?.(location)}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-primary hover:translate-x-2 transition-transform flex items-center gap-2 group/btn">
             <span>{t.view_schedule || 'View Schedule'}</span>
             <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </button>
      </div>
    </motion.div>
  )
}
