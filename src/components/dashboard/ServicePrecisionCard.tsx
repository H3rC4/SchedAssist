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
      className={`bg-white border border-primary/10 p-6 group relative transition-all hover:border-primary/30 rounded-none ${savedId === service.id ? 'ring-1 ring-primary ring-offset-0' : ''}`}
    >
      <div className="flex items-start justify-between mb-6">
        <div className={`h-14 w-14 bg-primary/[0.03] border border-primary/10 flex items-center justify-center ${iconData.color} transition-colors group-hover:bg-primary/[0.08] rounded-none`}>
          {iconData.icon}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(service)} 
            className="h-9 w-9 flex items-center justify-center bg-primary/[0.03] border border-primary/10 text-primary/40 hover:text-primary hover:bg-primary/10 transition-all rounded-none"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button 
            onClick={() => onDelete(service.id)} 
            className="h-9 w-9 flex items-center justify-center bg-primary/[0.03] border border-primary/10 text-primary/40 hover:text-red-600 hover:bg-red-50 transition-all rounded-none"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px w-6 bg-primary/20" />
          <p className="text-[8px] font-black text-primary/60 uppercase tracking-[0.4em]">
            {durationLabels[service.duration_minutes] || `${service.duration_minutes}m`}
          </p>
        </div>
        <h3 className="text-xl font-black text-[#191c1e] tracking-tighter group-hover:text-primary transition-colors leading-tight uppercase italic">
          {service.name}
        </h3>
        
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-primary/10">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-primary/40" />
            <span className="text-[10px] font-black text-[#191c1e]/60 uppercase tracking-[0.2em]">{durationLabels[service.duration_minutes] || `${service.duration_minutes}m`}</span>
          </div>
          {service.price ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black text-primary/40 uppercase tracking-widest">$</span>
              <span className="text-2xl font-black text-[#191c1e] tracking-tighter italic">{service.price}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/[0.03] border border-primary/10">
              <Info className="h-3 w-3 text-primary/40" />
              <span className="text-[8px] font-black text-primary/60 uppercase tracking-[0.3em]">RESERVADO</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
