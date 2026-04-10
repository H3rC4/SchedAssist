"use client"

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
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
  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1']
  const t = translations[lang] || translations['es']
  const dateLocale = lang === 'it' ? it : (lang === 'es' ? es : enUS)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
            {format(parseISO(label), 'EEEE d MMMM', { locale: dateLocale })}
          </p>
          <p className="text-lg font-black text-slate-800 dark:text-white">
            {payload[0].value} <span className="text-sm font-bold text-slate-500">{t.appointments.toLowerCase()}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Activity Chart */}
      <div className="lg:col-span-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 dark:border-white/10 p-8 shadow-[0_32px_64px_-16px_rgba(31,38,135,0.07)] noise">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t.weekly_activity}</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{t.appointments_volume}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.2)" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                tickFormatter={(str) => format(parseISO(str), 'EEE', { locale: dateLocale })}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#6366f1" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorCount)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution & Revenue */}
      <div className="lg:col-span-4 space-y-8">
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 dark:border-white/10 p-8 shadow-[0_32px_64px_-16px_rgba(31,38,135,0.07)] h-full noise flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-6">{t.distribution}</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: 'none', color: 'white' }}
                     itemStyle={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {statusData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {item.name === 'completed' ? t.confirmed : (item.name === 'cancelled' ? t.canceled : (item.name === 'pending' ? t.pending : item.name))}
                    </span>
                  </div>
                  <span className="text-sm font-black text-slate-800 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200/50 dark:border-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 text-center">{t.estimated_revenue}</p>
            <h4 className="text-4xl font-black text-slate-900 dark:text-white text-center tracking-tighter">
              ${revenue.toLocaleString()}
            </h4>
            <div className="mt-4 px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-center">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t.appointments_completed}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
