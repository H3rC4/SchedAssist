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
    <div className="bg-white border border-primary/10 p-8 hover:border-primary/30 transition-all duration-300 group relative overflow-hidden">
      {/* Decorative Technical Elements */}
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/10 group-hover:bg-primary transition-colors" />
      <div className="absolute top-0 right-0 p-3 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
        <Icon className="h-16 w-16" />
      </div>
      
      <div className="flex items-start justify-between mb-10">
        {/* Icon square */}
        <div className="h-10 w-10 bg-primary/[0.03] border border-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
          <Icon className="h-4 w-4" />
        </div>
        
        {/* Change badge - Technical style */}
        {change && (
          <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border ${
            changeType === 'increase'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : 'bg-primary/[0.03] border-primary/10 text-primary/40'
          }`}>
            {changeType === 'increase' ? '↑' : '↓'} {change}
          </span>
        )}
      </div>

      <div>
        <dd className="text-4xl font-black text-[#191c1e] tracking-tighter uppercase leading-none mb-3 italic">
          {value}
        </dd>
        <dt className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em]">
          {name}
        </dt>
      </div>
    </div>
  )
}
