"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Calendar, Users, CheckCircle, Clock, ChevronRight, Target,
  MoreHorizontal, ArrowUpRight, Plus, ExternalLink, Copy, Check,
  MessageSquare, LayoutDashboard, Zap, ArrowRight, TrendingUp,
  Activity, ShieldCheck, Layers
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { translations, dateLocales, Language } from '@/lib/i18n'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { motion, AnimatePresence } from 'framer-motion'

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [pendingCalls, setPendingCalls] = useState<any[]>([])
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, completed: 0, clients: 0, chartData: [], statusData: [], revenue: 0 })
  const [loading, setLoading] = useState(true)
  const [tenantName, setTenantName] = useState('Admin')
  const [tenantSlug, setTenantSlug] = useState('')
  const [lang, setLang] = useState<Language>('es')
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
    setLang((tenant.settings?.language as Language) || 'es')

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
    <div className="min-h-full bg-surface py-editorial-tight md:py-editorial overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto px-6 md:px-editorial">
        
        {/* Editorial Header */}
        <header className="mb-20 md:mb-32">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center gap-4 mb-8">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
               <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.4em]">Operational Pulse • {format(new Date(), 'MMM dd, yyyy')}</p>
            </div>
            <h1 className="precision-header max-w-4xl">
              Operational <br />
              <span className="text-primary/20 italic font-medium">Intelligence</span>
            </h1>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mt-12">
               <p className="precision-subheader max-w-lg">
                 Welcome back, <span className="text-on-surface">{tenantName}</span>. Your clinical metrics are optimized and synchronized.
               </p>
               <div className="flex items-center gap-4">
                  <button className="precision-button-tonal">Export Insights</button>
                  <Link href="/dashboard/appointments?new=true" className="precision-button-primary group flex items-center gap-4">
                    <span>New Event</span>
                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                  </Link>
               </div>
            </div>
          </motion.div>
        </header>

        {/* KPI Grid */}
        <section className="asymmetric-layout mb-32">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Total Flow', value: stats.total, icon: Activity, trend: '+12.4%' },
                { label: 'Active Clients', value: stats.clients, icon: Users, trend: '+5.1%' },
                { label: 'Completed', value: stats.completed, icon: ShieldCheck, trend: '88%' },
                { label: 'Pending', value: stats.pending, icon: Clock, trend: '-2.3%' },
              ].map((kpi, idx) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="precision-surface-lowest p-10 flex flex-col justify-between group hover:border-primary/20 transition-all border border-transparent"
                >
                  <div className="flex items-start justify-between mb-12">
                    <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                      <kpi.icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">{kpi.trend}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.3em] mb-2">{kpi.label}</p>
                    <h3 className="text-5xl font-black text-on-surface tracking-tighter group-hover:text-primary transition-colors">{kpi.value}</h3>
                  </div>
                </motion.div>
              ))}
           </div>
        </section>

        {/* Core Content Grid */}
        <section className="asymmetric-layout grid grid-cols-1 xl:grid-cols-12 gap-16">
          
          {/* Left Column: Activity & Portal */}
          <div className="xl:col-span-8 space-y-16">
            
            {/* Booking Portal Precision Banner */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden bg-on-surface rounded-[4rem] p-12 md:p-20 text-white"
            >
               <div className="absolute top-0 right-0 p-20 opacity-10 pointer-events-none">
                  <Zap className="h-64 w-64 text-white" />
               </div>
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                  <div className="max-w-md">
                     <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-6">Patient Interface</p>
                     <h2 className="text-5xl font-black tracking-tighter mb-8 leading-none">Booking Portal is Active.</h2>
                     <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-full px-8 py-4 border border-white/10 group">
                        <span className="text-white/40 font-bold text-sm tracking-tight truncate">.../book/{tenantSlug}</span>
                        <button onClick={copyToClipboard} className="p-2 hover:text-primary transition-colors">
                           {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                        </button>
                     </div>
                  </div>
                  <Link href={`/book/${tenantSlug}`} target="_blank" className="precision-button-primary bg-white text-on-surface hover:bg-primary hover:text-white flex items-center gap-4 py-8 px-12 rounded-[2rem]">
                    <span className="text-lg">View Portal</span>
                    <ExternalLink className="h-6 w-6" />
                  </Link>
               </div>
            </motion.div>

            {/* Upcoming Events */}
            <div className="space-y-10">
               <div className="flex items-center justify-between px-4">
                  <h3 className="text-2xl font-black text-on-surface tracking-tighter uppercase">Upcoming Synchronizations</h3>
                  <Link href="/dashboard/appointments" className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 hover:translate-x-2 transition-transform">
                     Full Calendar <ArrowRight className="h-4 w-4" />
                  </Link>
               </div>

               <div className="space-y-6">
                  {appointments.length === 0 ? (
                    <div className="precision-surface-lowest p-20 text-center rounded-[3rem]">
                       <Layers className="h-12 w-12 text-primary/10 mx-auto mb-6" />
                       <p className="text-on-surface/30 font-bold uppercase tracking-widest text-xs">No scheduled activity</p>
                    </div>
                  ) : (
                    appointments.map((app, idx) => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="precision-surface-lowest p-8 flex items-center gap-8 group hover:border-primary/10 transition-all border border-transparent"
                      >
                         <div className="h-20 w-20 rounded-[2rem] bg-primary text-white flex flex-col items-center justify-center font-black tracking-tighter shadow-spatial group-hover:scale-105 transition-transform">
                            <span className="text-[10px] uppercase opacity-60 leading-none mb-1">{format(parseISO(app.start_at), 'MMM')}</span>
                            <span className="text-3xl leading-none">{format(parseISO(app.start_at), 'dd')}</span>
                         </div>
                         <div className="flex-1">
                            <p className="text-2xl font-black text-on-surface group-hover:text-primary transition-colors leading-none mb-3">
                               {app.clients?.first_name} {app.clients?.last_name}
                            </p>
                            <div className="flex items-center gap-6 text-on-surface/40 font-bold text-[10px] uppercase tracking-widest">
                               <span className="flex items-center gap-2"><Clock className="h-3 w-3" /> {format(parseISO(app.start_at), 'HH:mm')}</span>
                               <span className="flex items-center gap-2"><Layers className="h-3 w-3" /> {app.services?.name}</span>
                            </div>
                         </div>
                         <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            app.status === 'confirmed' ? 'bg-primary/5 text-primary' : 'bg-on-surface/5 text-on-surface/30'
                         }`}>
                            {app.status}
                         </div>
                         <button className="h-12 w-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface/20 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                            <ArrowUpRight className="h-5 w-5" />
                         </button>
                      </motion.div>
                    ))
                  )}
               </div>
            </div>
          </div>

          {/* Right Column: Analytics & Completion */}
          <div className="xl:col-span-4 space-y-12">
             
             {/* Target Progression */}
             <div className="precision-surface-lowest p-12 flex flex-col items-center text-center rounded-[4rem]">
                <div className="h-16 w-16 rounded-[2rem] bg-primary/5 flex items-center justify-center text-primary mb-10">
                   <Target className="h-8 w-8" />
                </div>
                <h4 className="text-2xl font-black text-on-surface tracking-tighter uppercase mb-4">Precision Goal</h4>
                <p className="text-sm font-medium text-on-surface/40 leading-relaxed mb-12">
                   Your patient conversion rate is currently at <span className="text-on-surface font-black">{completionPct}%</span> for this period.
                </p>

                <div className="relative h-56 w-56">
                   <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      <circle stroke="currentColor" strokeWidth="2.5" fill="transparent" r="16" cx="18" cy="18" className="text-on-surface/5" />
                      <motion.circle 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        fill="transparent" 
                        strokeLinecap="round"
                        r="16" cx="18" cy="18" 
                        className="text-primary"
                        initial={{ strokeDasharray: "0 100" }}
                        animate={{ strokeDasharray: `${completionPct} 100` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black tracking-tighter text-on-surface">{completionPct}%</span>
                      <span className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] mt-1">Confirmed</span>
                   </div>
                </div>

                <div className="mt-12 w-full grid grid-cols-3 gap-4 pt-10 border-t border-on-surface/5">
                   <div>
                      <p className="text-xl font-black text-on-surface">{stats.completed}</p>
                      <p className="text-[8px] font-black text-on-surface/30 uppercase tracking-widest mt-1">Confirmed</p>
                   </div>
                   <div>
                      <p className="text-xl font-black text-on-surface">{stats.pending}</p>
                      <p className="text-[8px] font-black text-on-surface/30 uppercase tracking-widest mt-1">Pending</p>
                   </div>
                   <div>
                      <p className="text-xl font-black text-on-surface">{stats.total}</p>
                      <p className="text-[8px] font-black text-on-surface/30 uppercase tracking-widest mt-1">Total</p>
                   </div>
                </div>
             </div>

             {/* Dynamic Insights Placeholder */}
             <div className="precision-surface-lowest p-10 bg-primary text-white rounded-[3rem] overflow-hidden group">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                   <TrendingUp className="h-3 w-3" /> Monthly Growth
                </p>
                <h4 className="text-3xl font-black tracking-tighter leading-tight mb-8">Revenue has increased by <span className="text-white/40 italic">22%</span> compared to last month.</h4>
                <button className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] hover:translate-x-2 transition-transform">
                   Generate Full Report <ArrowRight className="h-4 w-4" />
                </button>
             </div>

          </div>
        </section>

        {/* Charts Section */}
        <section className="asymmetric-layout mt-32">
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
