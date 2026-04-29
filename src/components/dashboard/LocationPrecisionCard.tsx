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
}

export function LocationPrecisionCard({ location, index, savedId, onEdit, onDelete }: LocationPrecisionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className={`precision-surface-lowest p-10 flex flex-col justify-between group relative transition-all hover:translate-y-[-8px] hover:shadow-spatial ${savedId === location.id ? 'ring-4 ring-primary ring-offset-4' : ''}`}
    >
      <div className="flex items-start justify-between mb-12">
        <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-6 shadow-ambient">
          <Building2 className="h-10 w-10" />
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => onEdit(location)} 
            className="h-14 w-14 flex items-center justify-center bg-surface-container-low rounded-2xl text-on-surface-muted hover:text-primary hover:bg-surface-container-highest transition-all"
          >
            <Pencil className="h-6 w-6" />
          </button>
          <button 
            onClick={() => onDelete(location.id)} 
            className="h-14 w-14 flex items-center justify-center bg-surface-container-low rounded-2xl text-on-surface-muted hover:text-accent-rose hover:bg-accent-rose/10 transition-all"
          >
            <Trash2 className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-4 mb-4">
          <div className="h-1.5 w-8 bg-primary/20 rounded-full" />
          <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
            {location.city || 'Global'}
          </p>
        </div>
        <h3 className="text-4xl font-black text-on-surface tracking-tighter mb-8 group-hover:text-primary transition-colors leading-none uppercase">
          {location.name}
        </h3>
        <div className="space-y-4">
           <div className="flex items-start gap-4 text-on-surface-muted font-bold text-xs uppercase tracking-widest leading-relaxed">
              <Compass className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{location.address || 'Address not specified'}</span>
           </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-surface-container-highest flex items-center justify-between">
         <span className={`text-[10px] font-black uppercase tracking-[0.3em] px-5 py-2 rounded-full ${location.active ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-muted'}`}>
            {location.active ? 'Active Operation' : 'Inactive'}
         </span>
         <button className="text-[10px] font-black uppercase tracking-[0.3em] text-primary hover:translate-x-2 transition-transform flex items-center gap-2">
            View Schedule <ArrowRight className="h-4 w-4" />
         </button>
      </div>
    </motion.div>
  )
}
