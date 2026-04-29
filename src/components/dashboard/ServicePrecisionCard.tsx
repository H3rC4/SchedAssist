import { motion } from 'framer-motion'
import { Pencil, Trash2, Clock, Info, Sparkles, Stethoscope, Layers } from 'lucide-react'

interface Service {
  id: string
  name: string
  duration_minutes: number
  price?: number
  active: boolean
}

interface ServicePrecisionCardProps {
  service: Service
  index: number
  savedId: string | null
  durationLabels: Record<number, string>
  onEdit: (service: Service) => void
  onDelete: (id: string) => void
}

const getServiceIcon = (name: string) => {
  const lower = name.toLowerCase()
  if (lower.includes('limp') || lower.includes('puli') || lower.includes('fac')) 
    return { icon: <Sparkles className="h-8 w-8" />, color: 'text-accent-teal', bg: 'bg-accent-teal/10' }
  if (lower.includes('extr') || lower.includes('dent') || lower.includes('cons')) 
    return { icon: <Stethoscope className="h-8 w-8" />, color: 'text-primary', bg: 'bg-primary/10' }
  return { icon: <Layers className="h-8 w-8" />, color: 'text-secondary', bg: 'bg-secondary/10' }
}

export function ServicePrecisionCard({ service, index, savedId, durationLabels, onEdit, onDelete }: ServicePrecisionCardProps) {
  const iconData = getServiceIcon(service.name)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className={`precision-surface-lowest p-6 group relative transition-all hover:translate-y-[-4px] hover:shadow-spatial ${savedId === service.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      <div className="flex items-start justify-between mb-8">
        <div className={`h-16 w-16 rounded-2xl ${iconData.bg} flex items-center justify-center ${iconData.color} transition-transform duration-700 group-hover:scale-110 shadow-ambient`}>
          {iconData.icon && <iconData.icon.type {...iconData.icon.props} className="h-6 w-6" />}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(service)} 
            className="h-10 w-10 flex items-center justify-center bg-surface-container-low rounded-xl text-on-surface-muted hover:text-primary hover:bg-surface-container-highest transition-all"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button 
            onClick={() => onDelete(service.id)} 
            className="h-10 w-10 flex items-center justify-center bg-surface-container-low rounded-xl text-on-surface-muted hover:text-accent-rose hover:bg-accent-rose/10 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-1 w-6 bg-primary/20 rounded-full" />
          <p className="text-[8px] font-black text-on-surface-muted uppercase tracking-widest">
            {durationLabels[service.duration_minutes] || `${service.duration_minutes}m`} de sesión
          </p>
        </div>
        <h3 className="text-2xl font-black text-on-surface tracking-tighter group-hover:text-primary transition-colors leading-none uppercase">
          {service.name}
        </h3>
        
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-container-highest">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-on-surface-muted" />
            <span className="text-[10px] font-black text-on-surface uppercase tracking-widest">{durationLabels[service.duration_minutes] || `${service.duration_minutes}m`}</span>
          </div>
          {service.price ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-primary/40">$</span>
              <span className="text-xl font-black text-on-surface tracking-tighter">{service.price}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full">
              <Info className="h-3 w-3 text-on-surface-muted" />
              <span className="text-[8px] font-black text-on-surface-muted uppercase tracking-widest">A CONVENIR</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
