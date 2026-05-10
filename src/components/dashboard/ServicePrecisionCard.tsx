import { motion } from 'framer-motion'
import { Pencil, Trash2, Clock, Info, Sparkles, Stethoscope, Layers } from 'lucide-react'
import { useLandingTranslation } from '@/components/LanguageContext'

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
  onEdit?: (service: Service) => void
  onDelete?: (id: string) => void
}

const getServiceIcon = (name: string) => {
  const lower = name.toLowerCase()
  if (lower.includes('limp') || lower.includes('puli') || lower.includes('fac')) 
    return { icon: <Sparkles className="h-5 w-5" />, color: 'text-accent-teal', bg: 'bg-accent-teal/10' }
  if (lower.includes('extr') || lower.includes('dent') || lower.includes('cons')) 
    return { icon: <Stethoscope className="h-5 w-5" />, color: 'text-primary', bg: 'bg-primary/10' }
  return { icon: <Layers className="h-5 w-5" />, color: 'text-secondary', bg: 'bg-secondary/10' }
}

export function ServicePrecisionCard({ service, index, savedId, durationLabels, onEdit, onDelete }: ServicePrecisionCardProps) {
  const { fullT: t } = useLandingTranslation()
  const iconData = getServiceIcon(service.name)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
      className={`precision-surface-lowest p-4 flex items-center gap-4 group hover:border-primary/20 transition-all h-20 ${savedId === service.id ? 'ring-1 ring-primary ring-offset-0' : ''}`}
    >
      <div className={`h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center ${iconData.color} transition-colors group-hover:bg-primary/10 shrink-0`}>
        {iconData.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-black text-on-surface tracking-tighter truncate">{service.name}</h3>
        <p className="text-[7px] font-bold text-on-surface-muted uppercase tracking-widest flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" /> {durationLabels[service.duration_minutes] || `${service.duration_minutes}m`}
        </p>
      </div>
      
      {service.price ? (
        <span className="text-lg font-black text-on-surface tracking-tighter">${service.price}</span>
      ) : (
        <span className="text-[7px] font-black text-on-surface-muted uppercase tracking-widest px-2 py-1 bg-primary/5 rounded-full">{t.reserved}</span>
      )}
      
      {(onEdit || onDelete) && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={() => onEdit(service)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-on-surface-muted/40 hover:text-primary hover:bg-primary/5 transition-all"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(service.id)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-on-surface-muted/40 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
