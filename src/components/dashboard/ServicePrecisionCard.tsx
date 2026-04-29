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
    return { icon: <Sparkles className="h-6 w-6" />, color: 'text-accent-teal', bg: 'bg-accent-teal/10' }
  if (lower.includes('extr') || lower.includes('dent') || lower.includes('cons')) 
    return { icon: <Stethoscope className="h-6 w-6" />, color: 'text-primary', bg: 'bg-primary/10' }
  return { icon: <Layers className="h-6 w-6" />, color: 'text-secondary', bg: 'bg-secondary/10' }
}

export function ServicePrecisionCard({ service, index, savedId, durationLabels, onEdit, onDelete }: ServicePrecisionCardProps) {
  const iconData = getServiceIcon(service.name)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className={`precision-surface-lowest p-5 group relative transition-all hover:translate-y-[-2px] hover:shadow-spatial rounded-2xl ${savedId === service.id ? 'ring-1 ring-primary ring-offset-1' : ''}`}
    >
      <div className="flex items-start justify-between mb-5">
        <div className={`h-12 w-12 rounded-xl ${iconData.bg} flex items-center justify-center ${iconData.color} transition-transform duration-500 group-hover:scale-110 shadow-sm`}>
          {iconData.icon}
        </div>
        <div className="flex gap-1.5">
          <button 
            onClick={() => onEdit(service)} 
            className="h-8 w-8 flex items-center justify-center bg-surface-container-low rounded-lg text-on-surface-muted hover:text-primary hover:bg-surface-container-highest transition-all"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => onDelete(service.id)} 
            className="h-8 w-8 flex items-center justify-center bg-surface-container-low rounded-lg text-on-surface-muted hover:text-accent-rose hover:bg-accent-rose/10 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="h-0.5 w-4 bg-primary/20 rounded-full" />
          <p className="text-[7px] font-black text-on-surface-muted uppercase tracking-widest">
            {durationLabels[service.duration_minutes] || `${service.duration_minutes}m`}
          </p>
        </div>
        <h3 className="text-base font-black text-on-surface tracking-tighter group-hover:text-primary transition-colors leading-tight uppercase">
          {service.name}
        </h3>
        
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-container-highest">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-on-surface-muted" />
            <span className="text-[9px] font-black text-on-surface uppercase tracking-widest">{durationLabels[service.duration_minutes] || `${service.duration_minutes}m`}</span>
          </div>
          {service.price ? (
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-black text-primary/40">$</span>
              <span className="text-lg font-black text-on-surface tracking-tighter">{service.price}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-surface-container-low rounded-full">
              <Info className="h-2.5 w-2.5 text-on-surface-muted" />
              <span className="text-[7px] font-black text-on-surface-muted uppercase tracking-widest">PROX</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
