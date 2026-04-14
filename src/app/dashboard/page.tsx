"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Calendar, Users, CheckCircle, Clock, ChevronRight, Zap, Target, Star, MoreHorizontal, ArrowUpRight, ArrowDownRight, LayoutDashboard, Plus } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { translations, dateLocales, Language } from '@/lib/i18n'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [allAppsForExport, setAllAppsForExport] = useState<any[]>([])
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, completed: 0, clients: 0, chartData: [], statusData: [], revenue: 0 })
  const [loading, setLoading] = useState(true)
  const [tenantName, setTenantName] = useState('Admin')
  const [lang, setLang] = useState<Language>('es')
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: tuData } = await supabase
      .from('tenant_users')
      .select('tenant_id, tenants(id, name, settings)')
      .eq('user_id', user.id)
      .limit(1).single()

    if (!tuData?.tenants) return
    const tenant = tuData.tenants as any
    const tenantId = tenant.id
    setTenantName(tenant.name)
    setLang((tenant.settings?.language as Language) || 'es')

    const { data: apps } = await supabase.from('appointments').select(`
        id, status, start_at, 
        clients(id, first_name, last_name, phone),
        services(name, price),
        professionals(full_name)
      `).eq('tenant_id', tenantId).order('start_at', { ascending: false })

    if (apps) {
      setAllAppsForExport(apps)
      // For the UI list, we still show only upcoming 6
      const upcoming = apps
        .filter(a => new Date(a.start_at) >= new Date())
        .sort((a,b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
        .slice(0, 6)
      
      setAppointments(upcoming)
      
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return format(d, 'yyyy-MM-dd')
      })

      const chartData = last7Days.map(date => ({
        date,
        count: apps.filter(a => format(parseISO(a.start_at), 'yyyy-MM-dd') === date).length
      }))

      const statusData = [
        { name: 'Completadas', value: apps.filter(a => a.status === 'completed').length },
        { name: 'Pendientes', value: apps.filter(a => a.status === 'pending' || a.status === 'awaiting_confirmation').length },
        { name: 'Canceladas', value: apps.filter(a => a.status === 'cancelled').length },
      ]

      const totalRevenue = apps
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + ((a.services as any)?.price || 0), 0)

      const { count: totalClients } = await supabase.from('clients').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)

      setStats({
        total: apps.length,
        pending: apps.filter(a => a.status === 'pending' || a.status === 'awaiting_confirmation').length,
        completed: apps.filter(a => a.status === 'completed').length,
        clients: totalClients || 0,
        chartData,
        statusData,
        revenue: totalRevenue
      })
    }
    setLoading(false)
  }, [supabase]);

  useEffect(() => {
    fetchData()
    const channel = supabase.channel('realtime_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchData, supabase])

  const t = translations[lang] || translations['en']
  const dateLocale = dateLocales[lang] || dateLocales['en']

  const exportToCSV = () => {
    // Filter apps from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const appsToExport = allAppsForExport.filter(app => {
      const appDate = new Date(app.start_at)
      return appDate >= thirtyDaysAgo
    })

    if (appsToExport.length === 0) {
      alert(t.no_data_to_export);
      return;
    }
    
    const headers = [
      t.csv_headers.date, 
      t.csv_headers.client, 
      t.csv_headers.phone, 
      t.csv_headers.service, 
      t.csv_headers.professional, 
      t.csv_headers.price, 
      t.csv_headers.status
    ];
    const rows = appsToExport.map(app => [
      format(parseISO(app.start_at), 'yyyy-MM-dd HH:mm'),
      `"${app.clients?.first_name} ${app.clients?.last_name}"`,
      `"${app.clients?.phone}"`,
      `"${app.services?.name}"`,
      `"${app.professionals?.full_name}"`,
      app.services?.price || 0,
      app.status
    ]);

    const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_mensual_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out-expo max-w-[1400px] mx-auto pb-12">
      {/* Header / Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 stagger-children">
        <div className="relative">
            <div className="flex items-center gap-3 mb-4">
                <div className="status-dot-active" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none">
                  {t.system_active}
                </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-[-0.04em] leading-tight flex items-wrap items-center gap-x-4">
               {t.welcome} <span className="gradient-text">{tenantName}</span> 
               <div className="inline-flex h-12 w-12 bg-amber-500 rounded-xl items-center justify-center shadow-2xl shadow-amber-500/20 animate-float-subtle">
                 <Zap className="h-6 w-6 text-slate-950 fill-slate-950" />
               </div>
            </h1>
            <p className="text-sm font-bold text-slate-400 mt-4 uppercase tracking-[0.3em] pl-1">
              {format(new Date(), "EEEE d 'di' MMMM", { locale: dateLocale })}
            </p>
        </div>
        <div className="flex gap-4">
            <button className="h-14 px-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm hover:shadow-xl active:scale-95 flex items-center gap-2"
               onClick={exportToCSV}>
                {t.export_report}
            </button>
            <Link href="/dashboard/appointments?new=true" 
              className="h-14 px-8 rounded-2xl bg-slate-900 dark:bg-amber-500 text-[10px] font-black uppercase tracking-[0.2em] text-white dark:text-slate-900 shadow-2xl shadow-amber-500/10 hover:shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 group">
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" /> {t.new_appointment}
            </Link>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        <StatCard name={t.total_appointments} value={stats.total.toString()} icon={Calendar} change="+12%" changeType="increase" />
        <StatCard name={t.active_patients} value={stats.clients.toString()} icon={Users} change="+5%" changeType="increase" />
        <StatCard name={t.confirmed} value={stats.completed.toString()} icon={CheckCircle} change="-2%" changeType="decrease" />
        <StatCard name={t.pending} value={stats.pending.toString()} icon={Clock} change="+8%" changeType="increase" />
      </div>

      {/* Analytics Section */}
      <DashboardCharts 
        chartData={stats.chartData} 
        statusData={stats.statusData} 
        revenue={stats.revenue} 
        lang={lang} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Real-time Appointments Feed */}
        <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <Target className="h-6 w-6 text-amber-500" /> {t.upcoming_appointments}
                </h3>
                <a href="/dashboard/appointments" className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5 group hover:tracking-widest transition-all">
                    {t.see_full_calendar} <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-all" />
                </a>
            </div>

            <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-[0_32px_64px_-16px_rgba(31,38,135,0.07)] overflow-hidden noise">
                {appointments.length === 0 ? (
                   <div className="p-20 text-center flex flex-col items-center">
                       <div className="h-20 w-20 rounded-[2rem] bg-gray-50 flex items-center justify-center mb-6 border border-gray-100/50">
                           <LayoutDashboard className="h-10 w-10 text-gray-200" />
                       </div>
                       <p className="text-lg font-bold text-gray-400">
                         {t.no_activity_today}
                       </p>
                       <p className="text-sm text-gray-400 mt-2">
                         {t.bot_appointments_will_appear}
                       </p>
                   </div>
                ) : (
                  <div className="stagger-children p-2 flex flex-col gap-2">
                    {appointments.map((app, i) => (
                    <div key={app.id} className="group glass-card btn-magnetic flex items-center p-6 rounded-[2rem] bg-white border border-transparent hover:border-indigo-100/50">
                        <div className="relative mr-8">
                            <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 flex flex-col items-center justify-center shadow-inner group-hover:bg-primary-50 transition-all duration-500">
                                <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">{format(parseISO(app.start_at), 'MMM', { locale: dateLocale })}</span>
                                <span className="text-xl font-black text-slate-800 leading-none group-hover:text-primary-600 transition-colors">{format(parseISO(app.start_at), 'dd')}</span>
                            </div>
                            <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black ring-4 ring-white shadow-lg">
                                {format(parseISO(app.start_at), 'HH')}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <p className="truncate text-lg font-black text-slate-800 leading-tight">
                                    {app.clients?.first_name} {app.clients?.last_name}
                                </p>
                                <span className="h-4 px-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[8px] font-black uppercase tracking-[0.2em] flex items-center">
                                    {app.services?.name}
                                </span>
                            </div>
                            <p className="truncate text-sm font-bold text-slate-400 group-hover:text-amber-500 transition-colors">
                                con {app.professionals?.full_name} · {app.clients?.phone}
                            </p>
                        </div>

                        <div className="ml-4 flex items-center gap-4">
                            <div className={`px-4 py-2 rounded-full text-[9px] font-black tracking-widest uppercase shadow-sm transition-all
                                ${app.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 
                                  app.status === 'cancelled' ? 'bg-red-50 text-red-600 border border-red-100/50' : 'bg-amber-50 text-amber-600 border border-amber-100/50'}`}>
                                {app.status === 'confirmed' ? t.confirmed : 
                                 app.status === 'cancelled' ? t.canceled : 
                                 t.awaiting}
                            </div>
                            <button className="h-10 w-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-amber-500 hover:text-slate-900 hover:border-amber-500 transition-all duration-300">
                                <ArrowUpRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    ))}
                  </div>
                )}
            </div>
        </div>

        {/* Quick Context Panel */}
        <div className="lg:col-span-4 space-y-8">
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] shadow-xl h-full min-h-[460px] max-h-[500px]">
                <div className="relative z-10 flex flex-col h-full items-center justify-center text-center">
                    <div className="h-24 w-24 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-6">
                       <Target className="h-10 w-10 text-indigo-500" />
                    </div>
                    <h4 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter mb-2">
                      {t.activity_progress}
                    </h4>
                    <p className="text-slate-500 text-sm font-semibold leading-relaxed mb-8">
                      {t.activity_desc(stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0)}
                    </p>
                    
                    {/* Ring Visualizer */}
                    <div className="relative h-32 w-32 flex-shrink-0">
                        <svg className="h-full w-full -rotate-90 pointer-events-none" viewBox="0 0 36 36">
                            <circle stroke="rgba(99,102,241,0.1)" strokeWidth="4" fill="transparent" r="16" cx="18" cy="18" />
                            <circle className="text-indigo-500 animate-[count-up_1.5s_ease-out_forwards]" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="100, 100" strokeLinecap="round" r="16" cx="18" cy="18" style={{ strokeDashoffset: 100 - (stats.total > 0 ? (stats.completed / (stats.total || 1)) * 100 : 0) }} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl font-black text-slate-800 dark:text-white">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
