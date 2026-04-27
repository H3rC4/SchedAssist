"use client"

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { es, it, enUS } from 'date-fns/locale'
import { translations, Language } from '@/lib/i18n'

interface DashboardChartsProps {
  chartData: any[]
  statusData: any[]
  revenue: number
  lang?: Language
}

export function DashboardCharts({ chartData, statusData, revenue, lang = 'es' }: DashboardChartsProps) {
  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#0e7490']
  const t = translations[lang] || translations['es']
  const dateLocale = lang === 'it' ? it : (lang === 'es' ? es : enUS)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border-subtle p-4 rounded-xl shadow-float">
          <p className="text-[11px] font-semibold text-on-surface-muted uppercase tracking-widest mb-1">
            {format(parseISO(label), 'EEE d MMM', { locale: dateLocale })}
          </p>
          <p className="text-xl font-bold text-on-surface leading-none">
            {payload[0].value}{' '}
            <span className="text-sm font-medium text-on-surface-muted">
              {t.appointments.toLowerCase()}
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

      {/* ── Activity Area Chart ── */}
      <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-on-surface">{t.weekly_activity}</h3>
            <p className="text-sm text-on-surface-muted mt-0.5">{t.appointments_volume}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-light">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-[11px] font-semibold text-primary">Live</span>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0f766e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                tickFormatter={(str) => format(parseISO(str), 'EEE', { locale: dateLocale })}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#0f766e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorCount)"
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Distribution + Revenue ── */}
      <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-card flex flex-col">
        <h3 className="text-base font-semibold text-on-surface mb-5">{t.distribution}</h3>

        {/* Donut chart */}
        <div className="h-[180px] w-full flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={72}
                paddingAngle={6}
                dataKey="value"
                stroke="none"
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 8px 40px rgba(15,23,42,0.10)',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="space-y-2.5 mt-3">
          {statusData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium text-on-surface-muted capitalize">
                  {item.name === 'completed' ? t.confirmed
                    : item.name === 'cancelled' ? t.canceled
                    : item.name === 'pending'   ? t.pending
                    : item.name}
                </span>
              </div>
              <span className="text-sm font-bold text-on-surface">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Revenue */}
        <div className="mt-auto pt-5 border-t border-border-subtle">
          <p className="text-[11px] font-semibold text-on-surface-muted uppercase tracking-widest mb-1">
            {t.estimated_revenue}
          </p>
          <p className="text-3xl font-bold text-on-surface tracking-tight">
            ${revenue.toLocaleString()}
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-light">
            <div className="h-1.5 w-1.5 rounded-full bg-success" />
            <span className="text-[11px] font-semibold text-success">{t.appointments_completed}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
