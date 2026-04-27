"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Calendar, Users, CheckCircle, Clock, ChevronRight, Zap, Target, Star, MoreHorizontal, ArrowUpRight, ArrowDownRight, LayoutDashboard, Plus, ExternalLink, Copy, Check, MessageSquare } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { translations, dateLocales, Language } from '@/lib/i18n'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [pendingCalls, setPendingCalls] = useState<any[]>([])
  const [allAppsForExport, setAllAppsForExport] = useState<any[]>([])
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, completed: 0, clients: 0, chartData: [], statusData: [], revenue: 0 })
  const [loading, setLoading] = useState(true)
  const [notifyingId, setNotifyingId] = useState<string | null>(null)
  const [callNotes, setCallNotes] = useState<{[key: string]: string}>({})
  const [tenantName, setTenantName] = useState('Admin')
  const [tenantSlug, setTenantSlug] = useState('')
  const [lang, setLang] = useState<Language>('es')
  const [tenantId, setTenantId] = useState('')
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: tuData } = await supabase
      .from('tenant_users')
      .select('tenant_id, tenants(id, name, slug, settings)')
      .eq('user_id', user.id)
      .limit(1).single()

    if (!tuData?.tenants) return
    const tenant = tuData.tenants as any
    const tId = tenant.id
    setTenantId(tId)
    setTenantName(tenant.name)
    setTenantSlug(tenant.slug)
    setLang((tenant.settings?.language as Language) || 'es')

    const { data: apps } = await supabase.from('appointments').select(`
        id, status, start_at, cancellation_notified,
        clients(id, first_name, last_name, phone),
        services(name, price),
        professionals(full_name)
      `).eq('tenant_id', tId).order('start_at', { ascending: false })

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

      // Fetch pending calls
      setPendingCalls(apps.filter(a => a.status === 'cancelled' && !a.cancellation_notified))
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

  const markAsNotified = async (id: string) => {
    setNotifyingId(id)
    const notes = callNotes[id] || ''
    const { error } = await supabase.from('appointments').update({ 
      cancellation_notified: true,
      cancellation_notified_notes: notes 
    }).eq('id', id)
    if (!error) {
      setPendingCalls(prev => prev.filter(c => c.id !== id))
    }
    setNotifyingId(null)
  };

  const handleSendWhatsApp = async (appointment: any) => {
    setSendingId(appointment.id)
    try {
      const res = await fetch('/api/appointments/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appointment.id, tenant_id: tenantId })
      })
      if (res.ok) {
        setPendingCalls(prev => prev.filter(c => c.id !== appointment.id))
      } else {
        const data = await res.json()
        alert(data.error || 'Error sending message')
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setSendingId(null)
    }
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/book/${tenantSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out-expo max-w-[1400px] mx-auto pb-12">
      {/* Header / Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 stagger-children">
        <div className="relative">
            <div className="flex items-center gap-3 mb-4">
                <div className="status-dot-active" />
                <span className="text-[10px] font-black text-on-surface/50 uppercase tracking-[0.3em] leading-none">
                  {t.system_active}
                </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-on-surface tracking-tight leading-none flex flex-wrap items-center gap-x-4">
               {t.welcome} <span className="text-primary">{tenantName}</span> 
               <div className="inline-flex h-12 w-12 bg-primary rounded-[1.5rem] items-center justify-center shadow-ambient animate-float-subtle">
                 <Zap className="h-6 w-6 text-on-primary fill-on-primary" />
               </div>
            </h1>
            <p className="text-sm font-bold text-on-surface/50 mt-4 uppercase tracking-[0.3em] pl-1">
              {format(new Date(), "EEEE d 'di' MMMM", { locale: dateLocale })}
            </p>
        </div>
        <div className="flex gap-4">
            <button className="h-14 px-8 rounded-2xl bg-surface-container-lowest text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/70 hover:text-on-surface transition-all shadow-sm hover:shadow-ambient active:scale-95 flex items-center gap-2"
               onClick={exportToCSV}>
                {t.export_report}
            </button>
            <Link href="/dashboard/appointments?new=true" 
              className="h-14 px-8 rounded-2xl bg-primary text-[10px] font-black uppercase tracking-[0.2em] text-on-primary shadow-ambient hover:shadow-spatial transition-all hover:-translate-y-1 active:translate-y-0 active:scale-95 flex items-center gap-3 group">
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

      {/* Booking Portal Link Section */}
      <div className="bg-primary rounded-[2.5rem] p-8 md:p-10 shadow-ambient relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="h-40 w-40 text-on-primary rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-on-primary/10 text-on-primary text-[10px] font-black uppercase tracking-widest mb-6 shadow-sm">
                      <Star className="h-3 w-3 fill-on-primary" /> {t.booking_portal}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-on-primary uppercase tracking-tight mb-4">
                      {t.booking_portal_desc}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3">
                      <div className="bg-on-primary/5 rounded-2xl px-6 py-4 flex items-center gap-4 group/link transition-all hover:bg-on-primary/10 shadow-sm">
                          <span className="text-on-primary/70 font-mono text-sm">
                              schedassist.com/book/<span className="text-on-primary font-bold">{tenantSlug}</span>
                          </span>
                          <button 
                            onClick={copyToClipboard}
                            className="p-2 hover:bg-on-primary/10 rounded-xl text-on-primary/70 hover:text-on-primary transition-all flex items-center gap-2"
                          >
                              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                              <span className="text-[10px] font-black uppercase tracking-widest">{copied ? t.success : t.copy_link}</span>
                          </button>
                      </div>
                  </div>
              </div>
              
              <Link 
                href={`/book/${tenantSlug}`}
                target="_blank"
                className="h-20 px-10 bg-surface-container-lowest text-primary rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs flex items-center gap-3 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all shadow-ambient"
              >
                  {t.view_portal} <ExternalLink className="h-5 w-5" />
              </Link>
          </div>
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
        <div className="lg:col-span-8 space-y-10">
            {/* Pending Calls Alert Section */}
            {pendingCalls.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-black text-[#ba1a1a] tracking-tight flex items-center gap-3">
                    <Star className="h-6 w-6 fill-[#ba1a1a] animate-pulse" /> {t.pending_notification_title}
                  </h3>
                  <span className="text-[10px] font-black bg-[#ffdad6] text-[#93000a] px-3 py-1 rounded-full uppercase tracking-widest leading-none">
                    {pendingCalls.length} {t.total_pending_calls}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingCalls.map(call => (
                    <div key={call.id} className="relative group bg-[#ffdad6]/30 rounded-[2rem] p-6 hover:shadow-ambient transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-on-surface leading-none">
                              {call.clients?.first_name} {call.clients?.last_name}
                            </p>
                            <p className="text-[10px] font-bold text-on-surface/60 mt-1 uppercase tracking-wider">{call.clients?.phone}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <input 
                          type="text"
                          placeholder={t.notification_notes_placeholder}
                          value={callNotes[call.id] || ''}
                          onChange={(e) => setCallNotes(prev => ({ ...prev, [call.id]: e.target.value }))}
                          className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-3 text-[11px] font-bold text-on-surface placeholder:text-on-surface/40 focus:ring-2 focus:ring-[#ba1a1a]/20 outline-none transition-all shadow-sm"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-[10px] font-bold text-on-surface/60 uppercase">
                          {format(parseISO(call.start_at), 'd MMM · HH:mm', { locale: dateLocale })}
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleSendWhatsApp(call)}
                            disabled={sendingId === call.id || notifyingId === call.id}
                            className="h-10 px-4 rounded-xl bg-[#ba1a1a] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#93000a] transition-all flex items-center gap-2 shadow-sm"
                          >
                            {sendingId === call.id ? <Clock className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3" />}
                            {t.send_whatsapp}
                          </button>
                          <button 
                            onClick={() => markAsNotified(call.id)}
                            disabled={notifyingId === call.id || sendingId === call.id}
                            className="h-10 px-5 rounded-xl bg-surface-container-low text-on-surface text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-highest transition-all flex items-center gap-2 shadow-sm"
                          >
                            {notifyingId === call.id ? <Clock className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                            {t.mark_as_notified}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black text-on-surface tracking-tight flex items-center gap-3">
                    <Target className="h-6 w-6 text-primary" /> {t.upcoming_appointments}
                </h3>
                <a href="/dashboard/appointments" className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 group hover:tracking-widest transition-all">
                    {t.see_full_calendar} <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-all" />
                </a>
            </div>

            <div className="bg-surface-container-lowest rounded-[2.5rem] shadow-sm overflow-hidden">
                {appointments.length === 0 ? (
                   <div className="p-20 text-center flex flex-col items-center">
                       <div className="h-20 w-20 rounded-[2rem] bg-surface flex items-center justify-center mb-6 shadow-ambient">
                           <LayoutDashboard className="h-10 w-10 text-on-surface/30" />
                       </div>
                       <p className="text-lg font-bold text-on-surface/60">
                         {t.no_activity_today}
                       </p>
                       <p className="text-sm text-on-surface/40 mt-2">
                         {t.bot_appointments_will_appear}
                       </p>
                   </div>
                ) : (
                  <div className="stagger-children p-4 flex flex-col gap-4">
                    {appointments.map((app, i) => (
                    <div key={app.id} className="group flex items-center p-6 rounded-[2rem] bg-surface-container-low hover:bg-surface-container-highest transition-all duration-500 shadow-sm hover:shadow-ambient">
                        <div className="relative mr-8">
                            <div className="h-16 w-16 rounded-[1.5rem] bg-surface-container-lowest flex flex-col items-center justify-center shadow-sm group-hover:bg-primary transition-all duration-500">
                                <span className="text-[10px] font-black text-on-surface/50 uppercase leading-none mb-1 group-hover:text-on-primary/70">{format(parseISO(app.start_at), 'MMM', { locale: dateLocale })}</span>
                                <span className="text-xl font-black text-on-surface leading-none group-hover:text-on-primary transition-colors">{format(parseISO(app.start_at), 'dd')}</span>
                            </div>
                            <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-black shadow-ambient ring-2 ring-surface-container-lowest">
                                {format(parseISO(app.start_at), 'HH')}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <p className="truncate text-lg font-black text-on-surface leading-tight">
                                    {app.clients?.first_name} {app.clients?.last_name}
                                </p>
                                <span className="h-5 px-3 rounded-full bg-surface-container-lowest text-on-surface/60 text-[8px] font-black uppercase tracking-[0.2em] flex items-center shadow-sm">
                                    {app.services?.name}
                                </span>
                            </div>
                            <p className="truncate text-sm font-bold text-on-surface/50 group-hover:text-primary transition-colors">
                                con {app.professionals?.full_name} · {app.clients?.phone}
                            </p>
                        </div>

                        <div className="ml-4 flex items-center gap-4">
                            <div className={`px-4 py-2 rounded-full text-[9px] font-black tracking-widest uppercase shadow-sm transition-all
                                ${app.status === 'confirmed' ? 'bg-secondary-container text-on-secondary-container' : 
                                  app.status === 'cancelled' ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-primary-container text-on-primary-container'}`}>
                                {app.status === 'confirmed' ? t.confirmed : 
                                 app.status === 'cancelled' ? t.canceled : 
                                 t.awaiting}
                            </div>
                            <button className="h-10 w-10 bg-surface-container-lowest rounded-[1rem] flex items-center justify-center shadow-sm hover:bg-primary hover:text-on-primary transition-all duration-300">
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
            <div className="relative overflow-hidden bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-sm hover:shadow-ambient transition-all duration-700 h-full min-h-[460px] max-h-[500px]">
                <div className="relative z-10 flex flex-col h-full items-center justify-center text-center">
                    <div className="h-24 w-24 rounded-full bg-surface-container-low flex items-center justify-center mb-6 shadow-sm">
                       <Target className="h-10 w-10 text-primary" />
                    </div>
                    <h4 className="text-2xl font-black text-on-surface tracking-tighter mb-2">
                      {t.activity_progress}
                    </h4>
                    <p className="text-on-surface/50 text-sm font-semibold leading-relaxed mb-8">
                      {t.activity_desc(stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0)}
                    </p>
                    
                    {/* Ring Visualizer */}
                    <div className="relative h-32 w-32 flex-shrink-0">
                        <svg className="h-full w-full -rotate-90 pointer-events-none" viewBox="0 0 36 36">
                            <circle stroke="currentColor" className="text-surface-container-highest" strokeWidth="4" fill="transparent" r="16" cx="18" cy="18" />
                            <circle className="text-primary animate-[count-up_1.5s_ease-out_forwards]" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="100, 100" strokeLinecap="round" r="16" cx="18" cy="18" style={{ strokeDashoffset: 100 - (stats.total > 0 ? (stats.completed / (stats.total || 1)) * 100 : 0) }} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl font-black text-on-surface">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
