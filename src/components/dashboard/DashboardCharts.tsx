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
        <div className="bg-white border border-primary/10 p-6 rounded-none shadow-2xl">
          <p className="text-[9px] font-black text-primary/40 uppercase tracking-[0.4em] mb-2">
            {format(parseISO(label), 'EEE d MMM', { locale: dateLocale }).toUpperCase()}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#191c1e] tracking-tighter italic">
              {payload[0].value}
            </span>
            <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">
              {t.appointments.toUpperCase()}
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
      <div className="lg:col-span-8 bg-white border border-primary/10 p-10 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/5 group-hover:bg-primary transition-colors" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="h-px w-8 bg-primary" />
              <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.5em]">{t.appointments_volume.toUpperCase()}</p>
            </div>
            <h3 className="text-4xl font-black text-[#191c1e] tracking-tighter uppercase italic">{t.weekly_activity}</h3>
          </div>
          <div className="inline-flex items-center gap-4 px-5 py-2 border border-primary/10 bg-primary/[0.03] text-primary text-[10px] font-black uppercase tracking-[0.4em]">
            <div className="h-2 w-2 bg-primary shadow-[0_0_10px_rgba(0,92,85,0.4)]" />
            <span>OPERATIONAL SCAN</span>
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
      <div className="lg:col-span-4 bg-white border border-primary/10 p-10 flex flex-col relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-secondary/20 group-hover:bg-secondary transition-colors" />
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px w-8 bg-secondary" />
          <h3 className="text-xl font-black text-[#191c1e] tracking-tighter uppercase italic">{t.distribution}</h3>
        </div>

        {/* Donut chart */}
        <div className="h-[220px] w-full flex-shrink-0 mb-10">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={95}
                paddingAngle={0}
                dataKey="value"
                stroke="#fff"
                strokeWidth={3}
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(0,92,85,0.1)',
                  padding: '16px',
                  borderRadius: '0px',
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
        <div className="space-y-4 mb-12 flex-1">
          {statusData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between border-b border-primary/5 pb-3 group/item">
              <div className="flex items-center gap-4">
                <div
                  className="h-3 w-3 rounded-none transition-transform group-hover/item:scale-125"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em] group-hover/item:text-primary transition-colors">
                  {item.name === 'completed' ? t.confirmed.toUpperCase()
                    : item.name === 'cancelled' ? t.canceled.toUpperCase()
                    : item.name === 'pending'   ? t.pending.toUpperCase()
                    : item.name.toUpperCase()}
                </span>
              </div>
              <span className="text-base font-black text-[#191c1e] tracking-tighter italic">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Revenue */}
        <div className="mt-auto pt-10 border-t border-primary/10 relative">
          <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.5em] mb-4">
            {t.estimated_revenue.toUpperCase()}
          </p>
          <div className="flex items-baseline gap-3 mb-8">
             <span className="text-2xl font-black text-primary/30">$</span>
             <p className="text-5xl font-black text-[#191c1e] tracking-tighter uppercase italic">
               {revenue.toLocaleString()}
             </p>
          </div>
          <div className="inline-flex items-center gap-4 px-5 py-2 border border-primary/10 bg-primary/[0.03] text-primary text-[10px] font-black uppercase tracking-[0.4em]">
            <div className="h-1.5 w-1.5 bg-primary shadow-[0_0_8px_rgba(0,92,85,0.4)]" />
            <span>{t.appointments_completed.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
