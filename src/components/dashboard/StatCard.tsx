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
    <div className="glass-card btn-magnetic relative overflow-hidden rounded-[2.5rem] p-8 group border border-white/60 dark:border-white/10 shadow-[var(--shadow-weightless)] hover:shadow-[var(--shadow-spatial)] transition-all duration-700">
      {/* Dynamic Aura Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 via-transparent to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      {/* Glow Effect / Orbital Flare */}
      <div className="absolute -top-12 -right-12 h-40 w-40 bg-accent-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 group-hover:animate-float-subtle" />
      
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="h-16 w-16 rounded-[1.5rem] bg-white dark:bg-slate-900 backdrop-blur-xl flex items-center justify-center group-hover:bg-accent-500 transition-all duration-700 shadow-sm border border-slate-100 dark:border-white/5 ring-4 ring-slate-50 dark:ring-white/5 group-hover:ring-accent-500/20 group-hover:-translate-y-2 group-hover:rotate-[8deg]">
            <Icon className="h-8 w-8 text-slate-500 dark:text-slate-400 group-hover:text-slate-950 transition-colors duration-700" />
        </div>
        {change && (
            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all duration-700 group-hover:scale-110 ${
                changeType === 'increase' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
            }`}>
                {change}
            </div>
        )}
      </div>

      <div className="relative z-10 space-y-1">
        <dt className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pl-1">{name}</dt>
        <dd className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-slate-900 dark:text-white tracking-[-0.05em] group-hover:gradient-text transition-all duration-700">{value}</span>
        </dd>
      </div>

      {/* Spatial Mesh Texture (Subtle grid icon) */}
      <div className="absolute bottom-6 right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none -rotate-12 translate-x-4 translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-1000">
        <Icon size={120} className="fill-current" />
      </div>

      <div className="absolute inset-0 noise opacity-40 pointer-events-none" />
    </div>
  )
}
