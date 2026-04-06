"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Calendar, Users, CheckCircle, Clock, ChevronRight, Zap, Target, Star, MoreHorizontal, ArrowUpRight, ArrowDownRight, LayoutDashboard, Plus } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { translations, dateLocales, Language } from '@/lib/i18n'

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, clients: 0 })
  const [loading, setLoading] = useState(true)
  const [tenantName, setTenantName] = useState('Admin')
  const [lang, setLang] = useState<Language>('es')
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get tenant scoped to this user
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
        clients(first_name, last_name, phone),
        services(name),
        professionals(full_name)
      `).eq('tenant_id', tenantId).gte('start_at', new Date().toISOString()).order('start_at', { ascending: true }).limit(6)

    if (apps) setAppointments(apps)

    const { count: totalApps } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
    const { count: pendingApps } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'pending')
    const { count: completedApps } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'completed')
    const { count: totalClients } = await supabase.from('clients').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)

    setStats({
      total: totalApps || 0,
      pending: pendingApps || 0,
      completed: completedApps || 0,
      clients: totalClients || 0
    })
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

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1400px] mx-auto pb-12">
      {/* Header / Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                  {t.system_active}
                </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-[-0.04em] leading-tight flex items-center gap-4">
               {t.welcome} <span className="text-amber-500">{tenantName}</span> <Zap className="h-8 w-8 text-amber-400 fill-amber-100" />
            </h1>
            <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-[0.2em]">
              {format(new Date(), "EEEE d 'di' MMMM", { locale: dateLocale })}
            </p>
        </div>
        <div className="flex gap-3">
            <button className="px-6 py-3.5 rounded-2xl bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
               onClick={() => alert('Generating report...')}>
                {t.export_report}
            </button>
            <Link href="/dashboard/appointments?new=true" 
              className="px-6 py-3.5 rounded-2xl bg-slate-900 dark:bg-amber-500 text-[10px] font-black uppercase tracking-widest text-white dark:text-slate-900 shadow-xl hover:bg-slate-800 dark:hover:bg-amber-400 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                <Plus className="h-4 w-4" /> {t.new_appointment}
            </Link>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard name={t.total_appointments} value={stats.total.toString()} icon={Calendar} change="+12%" changeType="increase" />
        <StatCard name={t.active_patients} value={stats.clients.toString()} icon={Users} change="+5%" changeType="increase" />
        <StatCard name={t.confirmed} value={stats.completed.toString()} icon={CheckCircle} change="-2%" changeType="decrease" />
        <StatCard name={t.pending} value={stats.pending.toString()} icon={Clock} change="+8%" changeType="increase" />
      </div>

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
            <div className="relative overflow-hidden bg-gradient-to-br from-[#07091a] to-[#12163b] p-10 rounded-[2.5rem] shadow-2xl text-white group h-full min-h-[460px] max-h-[500px] border border-white/10 noise">
                {/* Visual Ambient Glow */}
                <div className="absolute -top-32 -right-20 w-80 h-80 bg-indigo-500/30 rounded-full blur-[80px] animate-float pointer-events-none" />
                <div className="absolute bottom-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-all duration-700 group-hover:scale-125 z-0">
                    <Star className="h-40 w-40 fill-white rotate-12" />
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                    <h4 className="text-3xl font-black tracking-tighter mb-4 leading-[1.1]">
                      {t.workload}
                    </h4>
                    <p className="text-indigo-200/60 text-sm font-semibold leading-relaxed mb-10">
                        {t.workload_desc(stats.pending)}
                    </p>
                    
                    {/* Ring Visualizer Simulation */}
                    <div className="flex items-center gap-6 mb-8">
                       <div className="relative h-20 w-20 flex-shrink-0">
                           {/* SVG Circle */}
                           <svg className="h-full w-full -rotate-90 pointer-events-none" viewBox="0 0 36 36">
                               <circle stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="transparent" r="16" cx="18" cy="18" />
                               <circle className="text-indigo-400 animate-[count-up_1.5s_ease-out_forwards]" stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray="100, 100" strokeLinecap="round" r="16" cx="18" cy="18" style={{ strokeDashoffset: 100 - (stats.completed / (stats.total || 1)) * 100 }} />
                           </svg>
                           <div className="absolute inset-0 flex items-center justify-center">
                               <span className="text-xl font-black text-white">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
                           </div>
                       </div>
                       <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-1">
                             {t.effectiveness}
                           </p>
                           <p className="text-2xl font-black text-white">{stats.completed} <span className="text-sm text-white/40 font-medium">/ {stats.total}</span></p>
                       </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/10">
                        <button className="w-full h-14 bg-white text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] text-[#07091a] hover:bg-indigo-50 transition-all active:scale-95 btn-magnetic flex items-center justify-center gap-2">
                            {t.manage_requests} <ArrowUpRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
