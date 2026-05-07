"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Calendar, Users, CheckCircle, Clock, ChevronRight, Target,
  MoreHorizontal, ArrowUpRight, Plus, ExternalLink, Copy, Check,
  MessageSquare, LayoutDashboard, Zap, ArrowRight, TrendingUp,
  Activity, ShieldCheck, Layers, Globe
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { translations, dateLocales, Language } from '@/lib/i18n'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { motion, AnimatePresence } from 'framer-motion'
import { useLandingTranslation } from '@/components/LanguageContext'

export default function DashboardPage() {
  const { language: lang, fullT: t } = useLandingTranslation()
  const [appointments, setAppointments] = useState<any[]>([])
  const [pendingCalls, setPendingCalls] = useState<any[]>([])
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, completed: 0, clients: 0, chartData: [], statusData: [], revenue: 0 })
  const [loading, setLoading] = useState(true)
  const [tenantName, setTenantName] = useState('Admin')
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantId, setTenantId] = useState('')
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

    const { data: apps } = await supabase.from('appointments').select(`
        id, status, start_at, cancellation_notified,
        clients(id, first_name, last_name, phone),
        services(name, price),
        professionals(full_name)
      `).eq('tenant_id', tId).order('start_at', { ascending: false })

    if (apps) {
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

  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="min-h-full bg-surface py-6 md:py-10 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* Compact Header */}
        <header className="mb-10 md:mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 mb-2">
               <div className="h-1.5 w-1.5 bg-primary animate-pulse shadow-[0_0_8px_rgba(0,92,85,0.4)]" />
               <p className="text-[9px] font-black text-primary/40 uppercase tracking-[0.5em]">{t.operational_pulse} • {format(new Date(), 'MMM dd, yyyy').toUpperCase()}</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#191c1e] tracking-tighter leading-tight max-w-4xl uppercase">
              {t.operational_intelligence.split(' ')[0]} <span className="text-primary italic font-black">{t.operational_intelligence.split(' ')[1] || ''}</span>
            </h1>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-8 pt-8 border-t border-primary/10">
               <p className="text-[11px] font-black text-[#191c1e]/40 uppercase tracking-[0.3em] max-w-xl leading-relaxed">
                  SYSTEM ACTIVE: <span className="text-[#191c1e]">{tenantName.toUpperCase()}</span>. {t.bot_appointments_will_appear.toUpperCase()}
               </p>
               <div className="flex items-center gap-4">
                  <button className="precision-button-tonal py-3 px-6 text-[9px]">{t.export_report}</button>
                  <Link href="/dashboard/appointments?new=true" className="precision-button-primary py-3 px-6 text-[10px] group">
                    <span>{t.new_appointment}</span>
                    <Plus className="h-3 w-3 group-hover:rotate-90 transition-transform" />
                  </Link>
               </div>
            </div>
          </motion.div>
        </header>

        {/* Normalized KPI Grid */}
        <section className="mb-12">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  className="bg-white border border-primary/10 p-8 flex flex-col justify-between group hover:border-primary/30 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/5 group-hover:bg-primary transition-colors" />
                  <div className="flex items-start justify-between mb-8">
                    <div className="h-10 w-10 bg-primary/[0.03] border border-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <kpi.icon className="h-4 w-4" />
                    </div>
                    <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">{kpi.trend}</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-primary/40 uppercase tracking-[0.4em] mb-1">{kpi.label}</p>
                    <h3 className="text-3xl font-black text-[#191c1e] tracking-tighter group-hover:text-primary transition-colors italic uppercase">{kpi.value}</h3>
                  </div>
                </motion.div>
              ))}
           </div>
        </section>

        {/* Content Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Activity & Portal */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Booking Portal Compact Banner */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden bg-[#001f1c] p-10 md:p-12 text-white group"
            >
               <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none select-none">
                 <Globe className="h-32 w-32 text-primary" />
               </div>
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="max-w-md">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="h-px w-8 bg-primary" />
                        <p className="text-[9px] font-black text-primary-400 uppercase tracking-[0.5em]">{t.patient_interface}</p>
                     </div>
                     <h2 className="text-3xl font-black tracking-tighter mb-6 leading-none uppercase">{t.booking_portal_active}</h2>
                     <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 px-5 py-3 group-hover:bg-white/[0.06] transition-all">
                        <span className="text-white/40 font-black text-[10px] tracking-widest truncate uppercase">schedassist.com/book/{tenantSlug}</span>
                        <button onClick={copyToClipboard} className="p-2 text-primary-400 hover:text-white transition-colors">
                           {copied ? <CheckCircle className="h-4 w-4 shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> : <Copy className="h-4 w-4" />}
                        </button>
                     </div>
                  </div>
                  <Link href={`/book/${tenantSlug}`} target="_blank" className="precision-button-primary bg-white text-[#001f1c] hover:bg-primary-light hover:text-white flex items-center gap-3 py-4 px-8 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t.view_portal}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
               </div>
            </motion.div>

            {/* Upcoming Events */}
            <div className="space-y-6">
               <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-1 bg-primary" />
                    <h3 className="text-xl font-black text-[#191c1e] tracking-tighter uppercase italic">{t.today_agenda}</h3>
                  </div>
                  <Link href="/dashboard/appointments" className="text-[9px] font-black text-primary uppercase tracking-[0.4em] flex items-center gap-2 hover:translate-x-2 transition-transform group">
                     {t.full_calendar} <ArrowRight className="h-3 w-3 group-hover:text-primary-light" />
                  </Link>
               </div>

               <div className="space-y-4">
                  {appointments.length === 0 ? (
                    <div className="bg-white border border-primary/10 p-12 text-center relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1 h-full bg-primary/5" />
                       <Layers className="h-8 w-8 text-primary/10 mx-auto mb-4" />
                       <p className="text-[#191c1e]/40 font-black uppercase tracking-[0.5em] text-[10px]">{t.no_activity_today}</p>
                    </div>
                  ) : (
                    appointments.map((app, idx) => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white border border-primary/10 p-6 flex items-center gap-6 group hover:border-primary/30 transition-all relative overflow-hidden"
                      >
                         <div className="absolute top-0 left-0 w-1 h-full bg-primary/10 group-hover:bg-primary transition-colors" />
                         <div className="h-12 w-12 bg-primary text-white flex flex-col items-center justify-center font-black tracking-tighter shadow-xl shadow-primary/20 group-hover:scale-105 transition-transform shrink-0">
                            <span className="text-[7px] uppercase opacity-60 leading-none mb-0.5">{format(parseISO(app.start_at), 'MMM').toUpperCase()}</span>
                            <span className="text-lg leading-none">{format(parseISO(app.start_at), 'dd')}</span>
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-base font-black text-[#191c1e] group-hover:text-primary transition-colors leading-none mb-2 truncate uppercase">
                               {app.clients?.first_name} {app.clients?.last_name}
                            </p>
                            <div className="flex items-center gap-4 text-[#191c1e]/40 font-black text-[9px] uppercase tracking-[0.2em] overflow-hidden">
                               <span className="flex items-center gap-1.5 shrink-0 text-primary/60"><Clock className="h-3 w-3" /> {format(parseISO(app.start_at), 'HH:mm')}</span>
                               <span className="flex items-center gap-1.5 truncate"><Layers className="h-3 w-3" /> {app.services?.name}</span>
                            </div>
                         </div>
                         <div className={`px-4 py-1.5 border text-[9px] font-black uppercase tracking-widest shrink-0 ${
                            app.status === 'confirmed' || app.status === 'completed'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                              : 'bg-primary/[0.03] border-primary/10 text-primary/60'
                         }`}>
                            {t[app.status] || app.status.toUpperCase()}
                         </div>
                         <button className="h-10 w-10 bg-primary/[0.03] border border-primary/10 flex items-center justify-center text-primary/30 group-hover:text-primary group-hover:bg-primary/10 transition-all shrink-0">
                            <ArrowUpRight className="h-4 w-4" />
                         </button>
                      </motion.div>
                    ))
                  )}
               </div>
            </div>
          </div>

          {/* Right Column: Analytics & Completion */}
          <div className="lg:col-span-4 space-y-8">
             
             {/* Target Progression */}
             <div className="bg-white border border-primary/10 p-8 flex flex-col items-center text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/5" />
                <div className="h-12 w-12 bg-primary/[0.03] border border-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                   <Target className="h-5 w-5" />
                </div>
                <h4 className="text-xl font-black text-[#191c1e] tracking-tighter uppercase mb-2">{t.precision_goal}</h4>
                <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em] mb-8 leading-loose">
                   {t.activity_desc(completionPct).toUpperCase()}
                </p>

                <div className="relative h-40 w-40 mb-10">
                   <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      <circle stroke="currentColor" strokeWidth="2.5" fill="transparent" r="16" cx="18" cy="18" className="text-primary/5" />
                      <motion.circle 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        fill="transparent" 
                        strokeLinecap="square"
                        r="16" cx="18" cy="18" 
                        className="text-primary"
                        initial={{ strokeDasharray: "0 100" }}
                        animate={{ strokeDasharray: `${completionPct} 100` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                      />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black tracking-tighter text-[#191c1e]">{completionPct}%</span>
                      <span className="text-[8px] font-black text-primary/40 uppercase tracking-[0.4em] mt-1">Efficiency</span>
                   </div>
                </div>

                <div className="w-full grid grid-cols-3 gap-4 pt-8 border-t border-primary/10">
                   <div>
                      <p className="text-lg font-black text-[#191c1e] tracking-tighter">{stats.completed}</p>
                      <p className="text-[7px] font-black text-primary/40 uppercase tracking-[0.2em] mt-1">{t.confirmed}</p>
                   </div>
                   <div>
                      <p className="text-lg font-black text-[#191c1e] tracking-tighter">{stats.pending}</p>
                      <p className="text-[7px] font-black text-primary/40 uppercase tracking-[0.2em] mt-1">{t.pending}</p>
                   </div>
                   <div>
                      <p className="text-lg font-black text-[#191c1e] tracking-tighter">{stats.total}</p>
                      <p className="text-[7px] font-black text-primary/40 uppercase tracking-[0.2em] mt-1">{t.appointments}</p>
                   </div>
                </div>
             </div>

             {/* Dynamic Insights Placeholder */}
             <div className="bg-[#001f1c] p-10 text-white relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
                <p className="text-[9px] font-black text-primary-400 uppercase tracking-[0.5em] mb-4 flex items-center gap-3">
                   <TrendingUp className="h-3 w-3" /> {t.monthly_growth.toUpperCase()}
                </p>
                <h4 className="text-xl font-black tracking-tighter leading-tight mb-8 uppercase italic">
                  Revenue increased by <span className="text-primary-400">22%</span>.
                </h4>
                <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white hover:text-primary-400 transition-colors group">
                   {t.generate_full_report} <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
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
    </div>
  )
}
