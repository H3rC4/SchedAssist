"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Calendar, Users, CheckCircle, Clock, ChevronRight, Target,
  MoreHorizontal, ArrowUpRight, Plus, ExternalLink, Copy, Check,
  MessageSquare, LayoutDashboard, Zap
} from 'lucide-react'
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
      const upcoming = apps
        .filter(a => new Date(a.start_at) >= new Date())
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
        .slice(0, 6)
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

  const t = translations[lang] || translations['en']
  const dateLocale = dateLocales[lang] || dateLocales['en']

  const exportToCSV = () => {
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const appsToExport = allAppsForExport.filter(app => new Date(app.start_at) >= thirtyDaysAgo)
    if (appsToExport.length === 0) { alert(t.no_data_to_export); return }
    const headers = [t.csv_headers.date, t.csv_headers.client, t.csv_headers.phone, t.csv_headers.service, t.csv_headers.professional, t.csv_headers.price, t.csv_headers.status]
    const rows = appsToExport.map(app => [
      format(parseISO(app.start_at), 'yyyy-MM-dd HH:mm'),
      `"${app.clients?.first_name} ${app.clients?.last_name}"`,
      `"${app.clients?.phone}"`,
      `"${app.services?.name}"`,
      `"${app.professionals?.full_name}"`,
      app.services?.price || 0,
      app.status
    ])
    const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.setAttribute("href", URL.createObjectURL(blob))
    link.setAttribute("download", `reporte_mensual_${format(new Date(), 'yyyyMMdd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  const markAsNotified = async (id: string) => {
    setNotifyingId(id)
    const { error } = await supabase.from('appointments').update({
      cancellation_notified: true,
      cancellation_notified_notes: callNotes[id] || ''
    }).eq('id', id)
    if (!error) setPendingCalls(prev => prev.filter(c => c.id !== id))
    setNotifyingId(null)
  }

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
        const data = await res.json(); alert(data.error || 'Error sending message')
      }
    } catch { alert('Network error') }
    finally { setSendingId(null) }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${window.location.origin}/book/${tenantSlug}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-10">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="status-dot-active" />
            <span className="text-xs font-semibold text-on-surface-muted uppercase tracking-widest">
              {t.system_active}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">
            {t.welcome}, <span className="text-primary">{tenantName}</span>
          </h1>
          <p className="text-sm text-on-surface-muted mt-0.5">
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: dateLocale })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-muted bg-white border border-border-subtle hover:bg-surface-container-low hover:text-on-surface transition-colors shadow-card"
          >
            {t.export_report}
          </button>
          <Link
            href="/dashboard/appointments?new=true"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark transition-colors shadow-card"
          >
            <Plus className="h-4 w-4" />
            {t.new_appointment}
          </Link>
        </div>
      </div>

      {/* ── KPI Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard name={t.total_appointments} value={stats.total.toString()} icon={Calendar} change="+12%" changeType="increase" />
        <StatCard name={t.active_patients}    value={stats.clients.toString()} icon={Users} change="+5%" changeType="increase" />
        <StatCard name={t.confirmed}          value={stats.completed.toString()} icon={CheckCircle} />
        <StatCard name={t.pending}            value={stats.pending.toString()} icon={Clock} change="+8%" changeType="increase" />
      </div>

      {/* ── Booking Portal Banner ── */}
      <div className="bg-primary-dark rounded-2xl p-6 md:p-8 relative overflow-hidden">
        {/* Subtle geometric decoration */}
        <div className="absolute right-6 top-0 bottom-0 flex items-center opacity-10 pointer-events-none">
          <Zap className="h-40 w-40 text-white" />
        </div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[11px] font-semibold uppercase tracking-widest mb-3">
              {t.booking_portal}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{t.booking_portal_desc}</h2>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 w-fit">
              <span className="text-white/60 font-mono text-sm">
                schedassist.com/book/<span className="text-white font-semibold">{tenantSlug}</span>
              </span>
              <button
                onClick={copyToClipboard}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors ml-1"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Link
            href={`/book/${tenantSlug}`}
            target="_blank"
            className="flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors shadow-float flex-shrink-0"
          >
            {t.view_portal}
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ── Charts ── */}
      <DashboardCharts chartData={stats.chartData} statusData={stats.statusData} revenue={stats.revenue} lang={lang} />

      {/* ── Bottom Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Appointments + Pending Calls */}
        <div className="lg:col-span-8 space-y-5">

          {/* Pending Cancellation Calls */}
          {pendingCalls.length > 0 && (
            <div className="bg-error-light rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-error flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-error animate-pulse inline-block" />
                  {t.pending_notification_title}
                </h3>
                <span className="text-[11px] font-semibold bg-error text-white px-2.5 py-1 rounded-full">
                  {pendingCalls.length} {t.total_pending_calls}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pendingCalls.map(call => (
                  <div key={call.id} className="bg-white rounded-xl p-4 shadow-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-lg bg-error-light flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-error" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface leading-none">
                          {call.clients?.first_name} {call.clients?.last_name}
                        </p>
                        <p className="text-[11px] text-on-surface-muted mt-0.5">{call.clients?.phone}</p>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder={t.notification_notes_placeholder}
                      value={callNotes[call.id] || ''}
                      onChange={(e) => setCallNotes(prev => ({ ...prev, [call.id]: e.target.value }))}
                      className="w-full bg-surface-container-low rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-muted outline-none focus:ring-2 focus:ring-primary/20 mb-3"
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-on-surface-muted">
                        {format(parseISO(call.start_at), 'd MMM · HH:mm', { locale: dateLocale })}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSendWhatsApp(call)}
                          disabled={sendingId === call.id || notifyingId === call.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error text-white text-[11px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {sendingId === call.id ? <Clock className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3" />}
                          {t.send_whatsapp}
                        </button>
                        <button
                          onClick={() => markAsNotified(call.id)}
                          disabled={notifyingId === call.id || sendingId === call.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-[11px] font-semibold hover:bg-surface-container-high transition-colors disabled:opacity-50"
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

          {/* Upcoming Appointments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-on-surface">{t.upcoming_appointments}</h3>
              <Link
                href="/dashboard/appointments"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t.see_full_calendar}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              {appointments.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-surface-container-low flex items-center justify-center mx-auto mb-4">
                    <LayoutDashboard className="h-7 w-7 text-on-surface-subtle" />
                  </div>
                  <p className="text-base font-medium text-on-surface-muted">{t.no_activity_today}</p>
                  <p className="text-sm text-on-surface-subtle mt-1">{t.bot_appointments_will_appear}</p>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {appointments.map((app) => (
                    <div key={app.id} className="flex items-center gap-4 p-4 hover:bg-surface-container-low transition-colors group">
                      {/* Date blob */}
                      <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary-light flex flex-col items-center justify-center">
                        <span className="text-[10px] font-semibold text-primary uppercase leading-none">
                          {format(parseISO(app.start_at), 'MMM', { locale: dateLocale })}
                        </span>
                        <span className="text-lg font-bold text-primary leading-none">
                          {format(parseISO(app.start_at), 'dd')}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">
                          {app.clients?.first_name} {app.clients?.last_name}
                        </p>
                        <p className="text-[12px] text-on-surface-muted mt-0.5 truncate">
                          {app.services?.name} · {format(parseISO(app.start_at), 'HH:mm')} · {app.professionals?.full_name}
                        </p>
                      </div>

                      {/* Status + action */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          app.status === 'confirmed'  ? 'bg-success-light text-success' :
                          app.status === 'cancelled'  ? 'bg-error-light text-error' :
                          'bg-warning-light text-warning'
                        }`}>
                          {app.status === 'confirmed' ? t.confirmed :
                           app.status === 'cancelled' ? t.canceled : t.awaiting}
                        </span>
                        <button className="h-8 w-8 rounded-lg flex items-center justify-center text-on-surface-subtle hover:bg-surface-container-low hover:text-primary transition-colors">
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Completion Ring */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-card p-6 h-full min-h-[360px] flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-primary-light flex items-center justify-center mb-5">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h4 className="text-base font-semibold text-on-surface mb-1">{t.activity_progress}</h4>
            <p className="text-sm text-on-surface-muted mb-6 leading-relaxed">
              {t.activity_desc(completionPct)}
            </p>

            {/* SVG Ring */}
            <div className="relative h-36 w-36 flex-shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  stroke="#e0f2fe"
                  strokeWidth="3.5"
                  fill="transparent"
                  r="15.5"
                  cx="18"
                  cy="18"
                />
                <circle
                  stroke="#0f766e"
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray="97.4 97.4"
                  strokeLinecap="round"
                  r="15.5"
                  cx="18"
                  cy="18"
                  style={{ strokeDashoffset: 97.4 - (completionPct / 100) * 97.4 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-on-surface">{completionPct}%</span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="font-bold text-on-surface">{stats.completed}</p>
                <p className="text-[11px] text-on-surface-muted">{t.confirmed}</p>
              </div>
              <div className="h-6 w-px bg-border-subtle" />
              <div className="text-center">
                <p className="font-bold text-on-surface">{stats.pending}</p>
                <p className="text-[11px] text-on-surface-muted">{t.pending}</p>
              </div>
              <div className="h-6 w-px bg-border-subtle" />
              <div className="text-center">
                <p className="font-bold text-on-surface">{stats.total}</p>
                <p className="text-[11px] text-on-surface-muted">{lang === 'es' ? 'Total' : 'Total'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
