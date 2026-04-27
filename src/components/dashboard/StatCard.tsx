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
    <div className="bg-white rounded-2xl p-6 shadow-card hover:shadow-float hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-5">
        {/* Icon pill */}
        <div className="h-11 w-11 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {/* Change badge */}
        {change && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            changeType === 'increase'
              ? 'bg-success-light text-success'
              : 'bg-error-light text-error'
          }`}>
            {changeType === 'increase' ? '↑' : '↓'} {change}
          </span>
        )}
      </div>

      <div>
        <dd className="text-3xl font-bold text-on-surface tracking-tight leading-none mb-1.5">
          {value}
        </dd>
        <dt className="text-sm font-medium text-on-surface-muted">
          {name}
        </dt>
      </div>
    </div>
  )
}
