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
    <div className="glass-card btn-magnetic relative overflow-hidden rounded-[2rem] p-8 group">
      {/* Glow Effect on Hover */}
      <div className="absolute -top-10 -right-10 h-32 w-32 bg-primary-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="h-14 w-14 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md flex items-center justify-center group-hover:bg-amber-500 transition-all duration-500 shadow-sm group-hover:shadow-xl group-hover:shadow-amber-200/20 border border-white/60 dark:border-white/10">
            <Icon className="h-7 w-7 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 transition-colors duration-500" />
        </div>
        {change && (
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                changeType === 'increase' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-red-50 text-red-600 border border-red-100/50'
            }`}>
                {change}
            </div>
        )}
      </div>

      <div className="relative z-10 animate-slide-up">
        <dt className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{name}</dt>
        <dd className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-800 tracking-tight group-hover:text-primary-600 transition-colors duration-500">{value}</span>
        </dd>
      </div>

      {/* Magical Accent Line */}
      <div className="absolute bottom-0 left-0 h-1.5 w-0 bg-amber-500 transition-all duration-700 group-hover:w-full opacity-0 group-hover:opacity-100" />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 noise z-0" />
    </div>
  )
}
