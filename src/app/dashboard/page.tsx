"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Calendar, Users, CheckCircle, Clock, ChevronRight, Target,
  MoreHorizontal, ArrowUpRight, Plus, ExternalLink, Copy, Check,
  MessageSquare, LayoutDashboard, Zap, ArrowRight, TrendingUp,
  Activity, ShieldCheck, Layers, FileDown, CalendarDays, Printer, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO, subDays } from 'date-fns'
import { translations, dateLocales, Language } from '@/lib/i18n'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { motion, AnimatePresence } from 'framer-motion'
import { useLandingTranslation } from '@/components/LanguageContext'

type DateRange = 'today' | '7days' | '30days' | 'custom'

export default function DashboardPage() {
  const { language: lang, fullT: t } = useLandingTranslation()
  const [appointments, setAppointments] = useState<any[]>([])
  const [allAppointments, setAllAppointments] = useState<any[]>([])
  const [pendingCalls, setPendingCalls] = useState<any[]>([])
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, completed: 0, clients: 0, chartData: [], statusData: [], revenue: 0 })
  const [loading, setLoading] = useState(true)
  const [tenantName, setTenantName] = useState('Admin')
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [copied, setCopied] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedRange, setSelectedRange] = useState<DateRange>('7days')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [exporting, setExporting] = useState(false)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: tuData } = await supabase
      .from('tenant_users')
      .select('tenant_id, role, tenants(id, name, slug, settings)')
      .eq('user_id', user.id)
      .limit(1).single()

    if (tuData?.role === 'secretary') {
      window.location.href = '/dashboard/appointments'
      return
    }

    if (!tuData?.tenants) return
    const tenant = tuData.tenants as any
    const tId = tenant.id
    setTenantId(tId)
    setTenantName(tenant.name)
    setTenantSlug(tenant.slug)

    const { data: apps } = await supabase.from('appointments').select(`
        id, status, start_at, cancellation_notified,
        clients(id, first_name, last_name, phone),
        services(name, price),
        professionals(full_name)
      `).eq('tenant_id', tId).order('start_at', { ascending: false })

    if (apps) {
      setAllAppointments(apps)
      const upcoming = apps
        .filter(a => new Date(a.start_at) >= new Date())
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
        .slice(0, 5)
      setAppointments(upcoming)

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i))
        return format(d, 'yyyy-MM-dd')
      })
      const chartData = last7Days.map(date => ({
        date,
        count: apps.filter(a => format(parseISO(a.start_at), 'yyyy-MM-dd') === date).length
      }))

      const statusData = [
        { name: 'completed', value: apps.filter(a => a.status === 'completed').length },
        { name: 'pending',   value: apps.filter(a => a.status === 'pending' || a.status === 'awaiting_confirmation').length },
        { name: 'cancelled', value: apps.filter(a => a.status === 'cancelled').length },
      ]

      const totalRevenue = apps
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + ((a.services as any)?.price || 0), 0)

      const { count: totalClients } = await supabase
        .from('clients').select('*', { count: 'exact', head: true }).eq('tenant_id', tId)

      setStats({ total: apps.length, pending: statusData[1].value, completed: statusData[0].value, clients: totalClients || 0, chartData, statusData, revenue: totalRevenue })
      setPendingCalls(apps.filter(a => a.status === 'cancelled' && !a.cancellation_notified))
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
    const channel = supabase.channel('realtime_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchData, supabase])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${window.location.origin}/book/${tenantSlug}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const getFilteredAppointments = () => {
    const now = new Date()
    let startDate: Date
    let endDate = now

    if (selectedRange === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (selectedRange === '7days') {
      startDate = subDays(now, 7)
    } else if (selectedRange === '30days') {
      startDate = subDays(now, 30)
    } else {
      startDate = customFrom ? new Date(customFrom) : subDays(now, 7)
      endDate = customTo ? new Date(customTo) : now
    }

    return allAppointments.filter(a => {
      const d = new Date(a.start_at)
      return d >= startDate && d <= endDate
    })
  }

  const handleExportCSV = async () => {
    setExporting(true)
    const filtered = getFilteredAppointments()

    const headers = ['ID', 'Paciente', 'Servicio', 'Profesional', 'Fecha', 'Hora', 'Estado', 'Precio']
    const rows = filtered.map(a => [
      a.id,
      `${a.clients?.first_name || ''} ${a.clients?.last_name || ''}`,
      a.services?.name || '',
      a.professionals?.full_name || '',
      format(parseISO(a.start_at), 'yyyy-MM-dd'),
      format(parseISO(a.start_at), 'HH:mm'),
      a.status,
      a.services?.price || 0
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `report_${selectedRange}_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setExporting(false)
    setShowExportModal(false)
  }

  const handlePrintPDF = () => {
    setShowExportModal(false)
    window.print()
  }

  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  const rangeLabels: Record<DateRange, string> = {
    today: lang === 'es' ? 'Hoy' : lang === 'it' ? 'Oggi' : 'Today',
    '7days': lang === 'es' ? 'Últimos 7 días' : lang === 'it' ? 'Ultimi 7 giorni' : 'Last 7 days',
    '30days': lang === 'es' ? 'Últimos 30 días' : lang === 'it' ? 'Ultimi 30 giorni' : 'Last 30 days',
    custom: lang === 'es' ? 'Personalizado' : lang === 'it' ? 'Personalizzato' : 'Custom',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-[0.3em] animate-pulse">
            {lang === 'es' ? 'Verificando Acceso...' : lang === 'it' ? 'Verifica Accesso...' : 'Verifying Access...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-surface py-1 md:py-2 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto px-4">
        
        {/* Compact Header */}
        <header className="mb-4 md:mb-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2 mb-0.5">
               <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
               <p className="text-[7px] font-black text-on-surface-muted uppercase tracking-[0.3em]">{t.operational_pulse} • {format(new Date(), 'MMM dd, yyyy')}</p>
            </div>
            <h1 className="text-lg md:text-xl font-black text-on-surface tracking-tighter leading-tight max-w-2xl">
              {t.operational_intelligence.split(' ')[0]} <span className="text-primary/40 italic font-medium">{t.operational_intelligence.split(' ')[1] || ''}</span>
            </h1>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mt-3">
               <p className="text-[10px] font-medium text-on-surface-muted max-w-lg leading-relaxed">
                 {t.welcome} <span className="text-on-surface font-bold">{tenantName}</span>. {t.bot_appointments_will_appear}
               </p>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setShowExportModal(true)}
                     className="precision-button-tonal py-1 px-2.5 text-[8px] flex items-center gap-1.5"
                   >
                     <FileDown className="h-3 w-3" />
                     {t.generate_report}
                   </button>
                </div>
            </div>
          </motion.div>
        </header>

        {/* Normalized KPI Grid */}
        <section className="mb-8">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: t.total_appointments, value: stats.total, icon: Activity, trend: '+12%' },
                { label: t.active_patients, value: stats.clients, icon: Users, trend: '+5%' },
                { label: t.confirmed, value: stats.completed, icon: ShieldCheck, trend: '88%' },
                { label: t.pending, value: stats.pending, icon: Clock, trend: '-2%' },
              ].map((kpi, idx) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="precision-surface-lowest p-4 flex flex-col justify-between group hover:border-primary/20 transition-all border border-transparent"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-7 w-7 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                      <kpi.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[7px] font-black text-primary/40 uppercase tracking-widest">{kpi.trend}</span>
                  </div>
                  <div>
                    <p className="text-[7px] font-black text-on-surface-muted uppercase tracking-[0.2em] mb-0.5">{kpi.label}</p>
                    <h3 className="text-xl font-black text-on-surface tracking-tighter group-hover:text-primary transition-colors">{kpi.value}</h3>
                  </div>
                </motion.div>
              ))}
           </div>
        </section>

        {/* Content Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Column: Activity & Portal */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Booking Portal Compact Banner */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden bg-on-surface rounded-[1.5rem] p-5 md:p-6 text-white"
            >
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="max-w-md">
                     <p className="text-[7px] font-black text-primary uppercase tracking-[0.3em] mb-1">{t.patient_interface}</p>
                     <h2 className="text-xl font-black tracking-tighter mb-3 leading-none">{t.booking_portal_active}.</h2>
                     <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10 group">
                        <span className="text-white/40 font-bold text-[9px] tracking-tight truncate max-w-[150px]">.../book/{tenantSlug}</span>
                        <button onClick={copyToClipboard} className="p-1 hover:text-primary transition-colors">
                           {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </button>
                     </div>
                  </div>
                  <Link href={`/book/${tenantSlug}`} target="_blank" className="precision-button-primary bg-white text-on-surface hover:bg-primary hover:text-white flex items-center gap-2 py-2 px-5 rounded-lg">
                    <span className="text-[9px] font-black uppercase tracking-widest">{t.view_portal}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
               </div>
            </motion.div>

            {/* Upcoming Events */}
            <div className="space-y-3">
               <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-black text-on-surface tracking-tighter uppercase">{t.today_agenda}</h3>
                  <Link href="/dashboard/appointments" className="text-[7px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 hover:translate-x-1 transition-transform">
                     {t.full_calendar} <ArrowRight className="h-2.5 w-2.5" />
                  </Link>
               </div>

               <div className="space-y-2">
                  {appointments.length === 0 ? (
                    <div className="precision-surface-lowest p-6 text-center rounded-[1rem]">
                       <Layers className="h-5 w-5 text-primary/10 mx-auto mb-2" />
                       <p className="text-on-surface-muted font-bold uppercase tracking-widest text-[8px]">{t.no_activity_today}</p>
                    </div>
                  ) : (
                    appointments.map((app, idx) => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="precision-surface-lowest p-3 flex items-center gap-3 group hover:border-primary/10 transition-all border border-transparent"
                      >
                         <div className="h-9 w-9 rounded-lg bg-primary text-white flex flex-col items-center justify-center font-black tracking-tighter shadow-spatial group-hover:scale-105 transition-transform shrink-0">
                            <span className="text-[6px] uppercase opacity-60 leading-none mb-0.5">{format(parseISO(app.start_at), 'MMM')}</span>
                            <span className="text-sm leading-none">{format(parseISO(app.start_at), 'dd')}</span>
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-on-surface group-hover:text-primary transition-colors leading-none mb-1 truncate">
                               {app.clients?.first_name} {app.clients?.last_name}
                            </p>
                            <div className="flex items-center gap-2 text-on-surface-muted font-bold text-[7px] uppercase tracking-widest overflow-hidden">
                               <span className="flex items-center gap-1 shrink-0"><Clock className="h-2 w-2" /> {format(parseISO(app.start_at), 'HH:mm')}</span>
                               <span className="flex items-center gap-1 truncate"><Layers className="h-2 w-2" /> {app.services?.name}</span>
                            </div>
                         </div>
                         <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest shrink-0 ${
                            app.status === 'confirmed' ? 'bg-primary/5 text-primary' : 'bg-on-surface/5 text-on-surface-muted'
                         }`}>
                            {t[app.status] || app.status}
                         </div>
                         <button className="h-7 w-7 rounded-md bg-surface-container-low flex items-center justify-center text-on-surface-muted/20 group-hover:text-primary group-hover:bg-primary/5 transition-all shrink-0">
                            <ArrowUpRight className="h-3 w-3" />
                         </button>
                      </motion.div>
                    ))
                  )}
               </div>
            </div>
          </div>

          {/* Right Column: Analytics & Completion */}
          <div className="lg:col-span-4 space-y-6">
             
             {/* Target Progression */}
             <div className="precision-surface-lowest p-5 flex flex-col items-center text-center rounded-[1.5rem]">
                <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary mb-3">
                   <Target className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-black text-on-surface tracking-tighter uppercase mb-1">{t.precision_goal}</h4>
                <p className="text-[9px] font-medium text-on-surface-muted leading-relaxed mb-4">
                   {t.activity_desc(completionPct)}
                </p>

                <div className="relative h-24 w-24">
                   <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      <circle stroke="currentColor" strokeWidth="3" fill="transparent" r="16" cx="18" cy="18" className="text-on-surface/5" />
                      <motion.circle 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        fill="transparent" 
                        strokeLinecap="round"
                        r="16" cx="18" cy="18" 
                        className="text-primary"
                        initial={{ strokeDasharray: "0 100" }}
                        animate={{ strokeDasharray: `${completionPct} 100` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black tracking-tighter text-on-surface">{completionPct}%</span>
                   </div>
                </div>

                <div className="mt-4 w-full grid grid-cols-3 gap-1 pt-3 border-t border-on-surface/5">
                   <div>
                      <p className="text-sm font-black text-on-surface">{stats.completed}</p>
                      <p className="text-[5px] font-black text-on-surface-muted uppercase tracking-widest mt-0.5">{t.confirmed}</p>
                   </div>
                   <div>
                      <p className="text-sm font-black text-on-surface">{stats.pending}</p>
                      <p className="text-[5px] font-black text-on-surface-muted uppercase tracking-widest mt-0.5">{t.pending}</p>
                   </div>
                   <div>
                      <p className="text-sm font-black text-on-surface">{stats.total}</p>
                      <p className="text-[5px] font-black text-on-surface-muted uppercase tracking-widest mt-0.5">{t.appointments}</p>
                   </div>
                </div>
             </div>

             {/* Dynamic Insights Placeholder */}
             <div className="precision-surface-lowest p-5 bg-primary text-white rounded-[1rem] overflow-hidden group">
                <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                   <TrendingUp className="h-2 w-2" /> {t.monthly_growth}
                </p>
                <h4 className="text-sm font-black tracking-tighter leading-tight mb-3">Revenue increased by <span className="text-white/40 italic">22%</span>.</h4>
                <button 
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-2 text-[7px] font-black uppercase tracking-[0.2em] hover:translate-x-1 transition-transform"
                >
                   {t.generate_full_report} <ArrowRight className="h-2.5 w-2.5" />
                </button>
             </div>

          </div>
        </section>

        {/* Charts Section */}
        <section className="mt-12">
           <DashboardCharts 
             chartData={stats.chartData} 
             statusData={stats.statusData} 
             revenue={stats.revenue} 
             lang={lang} 
           />
        </section>
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExportModal(false)}
              className="absolute inset-0 bg-on-surface/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                      <FileDown className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-on-surface tracking-tighter uppercase">{t.export_report}</h3>
                      <p className="text-[7px] font-black text-on-surface-muted uppercase tracking-[0.3em]">{lang === 'es' ? 'Selecciona formato y rango' : lang === 'it' ? 'Seleziona formato e intervallo' : 'Select format and range'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowExportModal(false)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-on-surface-muted/40 hover:text-on-surface hover:bg-surface-container-low transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Date Range Selector */}
                <div className="mb-6">
                  <label className="text-[7px] font-black text-on-surface-muted uppercase tracking-[0.3em] mb-3 block">{lang === 'es' ? 'Rango de fechas' : lang === 'it' ? 'Intervallo di date' : 'Date range'}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['today', '7days', '30days', 'custom'] as DateRange[]).map(range => (
                      <button
                        key={range}
                        onClick={() => setSelectedRange(range)}
                        className={`px-3 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] transition-all ${
                          selectedRange === range
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-surface-container-low text-on-surface-muted hover:bg-surface-container-low/80'
                        }`}
                      >
                        {rangeLabels[range]}
                      </button>
                    ))}
                  </div>
                  {selectedRange === 'custom' && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[7px] font-black text-on-surface-muted uppercase tracking-[0.2em] mb-1 block">{lang === 'es' ? 'Desde' : lang === 'it' ? 'Da' : 'From'}</label>
                        <input 
                          type="date" 
                          value={customFrom}
                          onChange={e => setCustomFrom(e.target.value)}
                          className="w-full bg-surface-container-low border border-on-surface/10 rounded-lg px-3 py-2 text-xs text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[7px] font-black text-on-surface-muted uppercase tracking-[0.2em] mb-1 block">{lang === 'es' ? 'Hasta' : lang === 'it' ? 'A' : 'To'}</label>
                        <input 
                          type="date" 
                          value={customTo}
                          onChange={e => setCustomTo(e.target.value)}
                          className="w-full bg-surface-container-low border border-on-surface/10 rounded-lg px-3 py-2 text-xs text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Export Options */}
                <div className="space-y-3">
                  <button
                    onClick={handleExportCSV}
                    disabled={exporting}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-low/80 transition-all group disabled:opacity-50"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      {exporting ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full" />
                      ) : (
                        <FileDown className="h-5 w-5" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-on-surface tracking-tighter">{lang === 'es' ? 'Exportar CSV' : lang === 'it' ? 'Esporta CSV' : 'Export CSV'}</p>
                      <p className="text-[7px] font-bold text-on-surface-muted">{lang === 'es' ? 'Datos filtrados por rango' : lang === 'it' ? 'Dati filtrati per intervallo' : 'Filtered data by range'}</p>
                    </div>
                  </button>

                  <button
                    onClick={handlePrintPDF}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-low/80 transition-all group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Printer className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-on-surface tracking-tighter">{lang === 'es' ? 'Imprimir / PDF' : lang === 'it' ? 'Stampa / PDF' : 'Print / PDF'}</p>
                      <p className="text-[7px] font-bold text-on-surface-muted">{lang === 'es' ? 'Usar diálogo del navegador' : lang === 'it' ? 'Usa dialogo del browser' : 'Use browser dialog'}</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
