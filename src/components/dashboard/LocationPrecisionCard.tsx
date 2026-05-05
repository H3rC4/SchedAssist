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
  t: any
}

export function LocationPrecisionCard({ location, index, savedId, onEdit, onDelete, t }: LocationPrecisionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className={`bg-surface border border-on-surface/5 p-6 flex flex-col justify-between group relative transition-all hover:shadow-lg rounded-3xl ${savedId === location.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      <div className="flex items-start justify-between mb-8">
        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary transition-transform duration-500 group-hover:scale-105 shadow-sm">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(location)} 
            className="h-10 w-10 flex items-center justify-center bg-on-surface/5 rounded-xl text-on-surface/40 hover:text-primary hover:bg-primary/5 transition-all"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button 
            onClick={() => onDelete(location.id)} 
            className="h-10 w-10 flex items-center justify-center bg-on-surface/5 rounded-xl text-on-surface/40 hover:text-accent-rose hover:bg-accent-rose/5 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-1 w-6 bg-primary/20 rounded-full" />
          <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">
            {location.city || (t.global || 'Global')}
          </p>
        </div>
        <h3 className="text-xl font-black text-on-surface tracking-tight mb-4 group-hover:text-primary transition-colors leading-tight uppercase">
          {location.name}
        </h3>
        <div className="space-y-3">
           <div className="flex items-start gap-3 text-on-surface/60 font-bold text-[10px] uppercase tracking-widest leading-relaxed">
              <Compass className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
              <span>{location.address || (t.address_not_specified || 'Address not specified')}</span>
           </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-on-surface/5 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${location.active ? 'bg-primary animate-pulse' : 'bg-on-surface/20'}`} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface/40">
               {location.active ? (t.active_operation || 'Active Operation') : (t.inactive || 'Inactive')}
            </span>
         </div>
         <button className="text-[9px] font-black uppercase tracking-[0.2em] text-primary hover:translate-x-1 transition-transform flex items-center gap-2">
            {t.view_schedule || 'View Schedule'} <ArrowRight className="h-3 w-3" />
         </button>
      </div>
    </motion.div>
  )
}
