import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  name: string
  value: string
  icon: LucideIcon
  change?: string
  changeType?: 'increase' | 'decrease'
}

export function StatCard({ name, value, icon: Icon, change, changeType }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[2.5rem] p-8 group bg-surface-container-lowest shadow-sm hover:shadow-ambient transition-all duration-700">
      {/* Dynamic Aura Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-container/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      {/* Glow Effect / Orbital Flare */}
      <div className="absolute -top-12 -right-12 h-40 w-40 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 group-hover:animate-float-subtle" />
      
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="h-16 w-16 rounded-[1.5rem] bg-surface flex items-center justify-center group-hover:bg-primary transition-all duration-700 shadow-ambient group-hover:-translate-y-2 group-hover:rotate-[8deg]">
            <Icon className="h-8 w-8 text-on-surface/60 group-hover:text-on-primary transition-colors duration-700" />
        </div>
        {change && (
            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm transition-all duration-700 group-hover:scale-110 ${
                changeType === 'increase' ? 'bg-secondary-container text-on-secondary-container' : 'bg-[#ffdad6] text-[#ba1a1a]'
            }`}>
                {change}
            </div>
        )}
      </div>

      <div className="relative z-10 space-y-1">
        <dt className="text-[10px] font-black text-on-surface/50 uppercase tracking-[0.3em] pl-1">{name}</dt>
        <dd className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-on-surface tracking-tight group-hover:text-primary transition-all duration-700">{value}</span>
        </dd>
      </div>

      {/* Spatial Mesh Texture (Subtle grid icon) */}
      <div className="absolute bottom-6 right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none -rotate-12 translate-x-4 translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-1000 text-primary">
        <Icon size={120} className="fill-current" />
      </div>
    </div>
  )
}
