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
  const COLORS = ['#005c55', '#855300', '#ba1a1a', '#001f1c']
  const t = translations[lang] || translations['es']
  const dateLocale = lang === 'it' ? it : (lang === 'es' ? es : enUS)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-primary/10 p-4 rounded-xl shadow-2xl">
          <p className="text-[7px] font-black text-on-surface-muted uppercase tracking-[0.3em] mb-1">
            {format(parseISO(label), 'EEE d MMM', { locale: dateLocale })}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-on-surface tracking-tighter">
              {payload[0].value}
            </span>
            <span className="text-[7px] font-black text-primary uppercase tracking-[0.2em]">
              {t.appointments}
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* ── Activity Area Chart ── */}
      <div className="lg:col-span-8 precision-surface-lowest p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[7px] font-black text-on-surface-muted uppercase tracking-[0.3em] mb-1">{t.appointments_volume}</p>
            <h3 className="text-sm font-black text-on-surface tracking-tighter uppercase">{t.weekly_activity}</h3>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary text-[7px] font-black uppercase tracking-[0.2em] rounded-full">
            <div className="h-1.5 w-1.5 bg-primary rounded-full" />
            <span>SCAN</span>
          </div>
        </div>

        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#005c55" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#005c55" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,92,85,0.05)" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#005c55', fontSize: 9, fontWeight: 900, opacity: 0.4 }}
                tickFormatter={(str) => format(parseISO(str), 'EEE', { locale: dateLocale }).toUpperCase()}
                dy={15}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#005c55', fontSize: 9, fontWeight: 900, opacity: 0.4 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#005c55"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorCount)"
                animationDuration={1500}
                strokeLinecap="square"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Distribution + Revenue ── */}
      <div className="lg:col-span-4 precision-surface-lowest p-6 md:p-8 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <p className="text-[7px] font-black text-on-surface-muted uppercase tracking-[0.3em]">{t.distribution}</p>
        </div>

        {/* Donut chart */}
        <div className="h-[200px] w-full flex-shrink-0 mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={0}
                dataKey="value"
                stroke="#fff"
                strokeWidth={2}
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(0,92,85,0.1)',
                  padding: '12px',
                  borderRadius: '8px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                }}
                itemStyle={{
                  fontSize: '10px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="space-y-3 mb-8 flex-1">
          {statusData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between border-b border-primary/5 pb-2 group/item">
              <div className="flex items-center gap-3">
                <div
                  className="h-2.5 w-2.5 rounded-sm transition-transform group-hover/item:scale-110"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-[8px] font-black text-on-surface-muted uppercase tracking-[0.2em] group-hover/item:text-primary transition-colors">
                  {item.name === 'completed' ? t.confirmed
                    : item.name === 'cancelled' ? t.canceled
                    : item.name === 'pending'   ? t.pending
                    : item.name}
                </span>
              </div>
              <span className="text-sm font-black text-on-surface tracking-tighter">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Revenue */}
        <div className="mt-auto pt-6 border-t border-primary/10">
          <p className="text-[7px] font-black text-on-surface-muted uppercase tracking-[0.3em] mb-2">
            {t.estimated_revenue}
          </p>
          <div className="flex items-baseline gap-2 mb-4">
             <span className="text-lg font-black text-primary/30">$</span>
             <p className="text-2xl font-black text-on-surface tracking-tighter">
               {revenue.toLocaleString()}
             </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary text-[7px] font-black uppercase tracking-[0.2em] rounded-full">
            <div className="h-1.5 w-1.5 bg-primary rounded-full" />
            <span>{t.appointments_completed}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
