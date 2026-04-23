"use client"

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'
import { translations, Language } from '@/lib/i18n'
import { TrendingUp, AlertTriangle, Users, DollarSign, Activity, MapPin, ChevronDown } from 'lucide-react'

export default function AnalyticsPage() {
  const supabase = createClient()
  const [tenantId, setTenantId] = useState('')
  const [lang, setLang] = useState<Language>('es')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [locations, setLocations] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('')

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  const fetchTenantAndData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: tuData } = await supabase
      .from('tenant_users')
      .select('tenant_id, tenants(id, settings)')
      .eq('user_id', user.id)
      .limit(1).single()

    if (tuData?.tenants) {
      const tenant = tuData.tenants as any
      setTenantId(tenant.id)
      setLang((tenant.settings?.language as Language) || 'es')
      
      // Fetch Locations
      const { data: locs } = await supabase
        .from('locations')
        .select('id, name')
        .eq('tenant_id', tenant.id)
        .eq('active', true)
      setLocations(locs || [])

      const url = `/api/analytics?tenant_id=${tenant.id}${selectedLocation ? `&location_id=${selectedLocation}` : ''}`
      const res = await fetch(url)
      if (res.ok) {
        const analyticsData = await res.json()
        setData(analyticsData)
      }
    }
    setLoading(false)
  }, [supabase, selectedLocation])

  useEffect(() => {
    fetchTenantAndData()
  }, [fetchTenantAndData])

  const t = translations[lang] || translations['es']

  if (loading) return null // Handled by loading.tsx

  if (!data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
      <Activity className="h-12 w-12 mb-4 opacity-50" />
      <p>{t.error_loading_metrics}</p>
    </div>
  )

  const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            {label}
          </p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
              {formatter ? formatter(p.value) : p.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary-600" /> {t.analytics_advanced}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t.analytics_advanced_desc}</p>
        </div>

        {locations.length > 0 && (
          <div className="relative group min-w-[200px]">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <MapPin className="h-4 w-4 text-primary-500" />
            </div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 appearance-none outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer shadow-sm group-hover:shadow-md"
            >
              <option value="">{lang === 'es' ? 'Todas las Sedes' : (lang === 'it' ? 'Tutte le Sedi' : 'All Locations')}</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        )}
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 bg-red-500/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t.no_show_rate}</p>
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{data.noShowRate}%</h3>
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500">
            {t.from} <span className="text-gray-900">{data.totalAppointments}</span> {t.appointments_total}, <span className="text-red-500">{data.cancelledAppointments}</span> {t.were_cancelled}.
          </p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t.top_professional_revenue}</p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight truncate max-w-[150px]">
                {data.revenueByProfessional[0]?.name || 'N/A'}
              </h3>
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500">
            {t.generated} <span className="text-emerald-600 font-black">${(data.revenueByProfessional[0]?.revenue || 0).toLocaleString()}</span> {t.this_year}.
          </p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 bg-primary-500/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-500">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t.star_service}</p>
              <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight truncate max-w-[150px]">
                {data.popularServices[0]?.name || 'N/A'}
              </h3>
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500">
            {t.performed} <span className="text-primary-600 font-black">{data.popularServices[0]?.count || 0} {t.times}</span>.
          </p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Revenue by Professional */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-lg font-black text-gray-900 mb-6">{t.revenue_by_professional}</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByProfessional} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={100} />
                <RechartsTooltip content={<CustomTooltip formatter={(val: number) => `$${val.toLocaleString()}`} />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]}>
                  {data.revenueByProfessional.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Services */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-lg font-black text-gray-900 mb-6">{t.service_demand}</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.popularServices}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="name"
                  stroke="none"
                >
                  {data.popularServices.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip formatter={(val: number) => t.citas_count(val)} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            {data.popularServices.slice(0, 4).map((srv: any, index: number) => (
              <div key={srv.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{srv.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-lg font-black text-gray-900 mb-6">{t.appointments_volume_year}</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.appointmentsByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMonth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip formatter={(val: number) => t.total_appointments_trend(val)} />} />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorMonth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}
