"use client"

import { useState, useEffect, useCallback } from 'react'
import { Clock, CheckCircle, Trash2, MessageSquare, Calendar, UserCheck, Loader2, Bell, RefreshCw, AlertCircle } from 'lucide-react'
import { Language, translations } from '@/lib/i18n'
import { format, parseISO } from 'date-fns'

interface WaitlistEntry {
  id: string
  tenant_id: string
  status: 'pending' | 'notified' | 'offer_expired' | 'resolved' | 'cancelled'
  preferred_date?: string
  start_date?: string
  end_date?: string
  notes?: string
  notified_at?: string
  offer_expires_at?: string
  created_at: string
  clients: { id: string; first_name: string; last_name: string; phone: string }
  professionals: { id: string; full_name: string; specialty?: string }
  services?: { id: string; name: string; duration_minutes: number }
}

interface WaitlistViewProps {
  tenantId: string
  lang: Language
}

export default function WaitlistView({ tenantId, lang }: WaitlistViewProps) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'all'>('active')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const T = translations[lang] || translations['es']

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending:       { label: T.waitlist_status_pending,       color: 'bg-accent-500/10 text-accent-500',   icon: Clock },
    notified:      { label: T.waitlist_status_notified,      color: 'bg-blue-500/10 text-blue-400',        icon: Bell },
    offer_expired: { label: T.waitlist_status_offer_expired, color: 'bg-orange-500/10 text-orange-400', icon: AlertCircle },
    resolved:      { label: T.waitlist_status_resolved,      color: 'bg-emerald-500/10 text-emerald-400', icon: CheckCircle },
    cancelled:     { label: T.waitlist_status_cancelled,     color: 'bg-primary-800 text-primary-400',        icon: Trash2 },
  }

  const fetchWaitlist = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = `/api/waitlists?tenant_id=${tenantId}${filter === 'all' ? '&status=all' : ''}`
      const res = await fetch(url)
      if (res.ok) setEntries(await res.json())
    } finally {
      setIsLoading(false)
    }
  }, [tenantId, filter])

  useEffect(() => { fetchWaitlist() }, [fetchWaitlist])

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      await fetch('/api/waitlists', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tenant_id: tenantId, status })
      })
      setEntries(prev => prev.map(e => e.id === id ? { ...e, status: status as any } : e))
    } finally {
      setUpdatingId(null)
    }
  }

  const deleteEntry = async (id: string) => {
    setUpdatingId(id)
    try {
      await fetch(`/api/waitlists?id=${id}&tenant_id=${tenantId}`, { method: 'DELETE' })
      setEntries(prev => prev.filter(e => e.id !== id))
    } finally {
      setUpdatingId(null)
    }
  }

  const formatDateRange = (entry: WaitlistEntry) => {
    if (entry.preferred_date) return { label: T.waitlist_specific_day, value: format(parseISO(entry.preferred_date), 'dd/MM/yyyy') }
    if (entry.start_date && entry.end_date) return { label: T.waitlist_range, value: `${format(parseISO(entry.start_date), 'dd/MM')} → ${format(parseISO(entry.end_date), 'dd/MM/yyyy')}` }
    return { label: T.waitlist_any_date, value: '–' }
  }

  const openWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank')
  }

  const pendingCount = entries.filter(e => e.status === 'pending').length
  const notifiedCount = entries.filter(e => e.status === 'notified').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-white">
            {T.waitlist_title}
          </h2>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 bg-accent-500/10 text-accent-500 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Clock className="h-3 w-3" />{pendingCount} {T.waitlist_waiting}
            </span>
          )}
          {notifiedCount > 0 && (
            <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Bell className="h-3 w-3" />{notifiedCount} {T.waitlist_notified}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-primary-950/50 rounded-2xl p-1 gap-1 border border-white/5">
            <button onClick={() => setFilter('active')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'active' ? 'bg-accent-500 shadow-xl shadow-accent-500/20 text-primary-950' : 'text-primary-400 hover:text-white'}`}>
              {T.waitlist_active}
            </button>
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-accent-500 shadow-xl shadow-accent-500/20 text-primary-950' : 'text-primary-400 hover:text-white'}`}>
              {T.waitlist_all}
            </button>
          </div>
          <button onClick={fetchWaitlist} disabled={isLoading} className="h-9 w-9 rounded-xl bg-primary-950/50 border border-white/5 flex items-center justify-center text-primary-400 hover:text-white transition-colors active:scale-95">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-800" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary-950/50 border border-white/5 flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-primary-800" />
          </div>
          <p className="text-sm font-bold text-primary-500 uppercase tracking-wider">{T.waitlist_empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const dateInfo = formatDateRange(entry)
            const statusCfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending
            const StatusIcon = statusCfg.icon
            const isUpdating = updatingId === entry.id
            const isExpiringSoon = entry.offer_expires_at && entry.status === 'notified'
              && (new Date(entry.offer_expires_at).getTime() - Date.now()) < 5 * 60 * 1000

            return (
              <div key={entry.id} className={`group relative bg-primary-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 transition-all hover:border-accent-500/30 ${isUpdating ? 'opacity-60 pointer-events-none' : ''} ${isExpiringSoon ? 'ring-1 ring-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black text-white truncate">
                        {entry.clients.first_name} {entry.clients.last_name}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${statusCfg.color}`}>
                        <StatusIcon className="h-2.5 w-2.5" />
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-primary-400">
                        <UserCheck className="h-3 w-3 text-accent-500" />{entry.professionals.full_name}
                      </span>
                      {entry.services && (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-primary-400">
                          <CheckCircle className="h-3 w-3 text-accent-500" />{entry.services.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-primary-400">
                        <Calendar className="h-3 w-3 text-accent-500" />
                        <span className="text-[10px] text-primary-500 uppercase tracking-wider">{dateInfo.label}:</span>
                        <span className="text-white/80">{dateInfo.value}</span>
                      </span>
                    </div>
                    {entry.notes && <p className="mt-1.5 text-[11px] text-primary-500 italic truncate border-l-2 border-white/5 pl-2">{entry.notes}</p>}
                    {entry.notified_at && (
                      <p className="mt-2 text-[10px] text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        {T.waitlist_notified_on} {format(parseISO(entry.notified_at), 'dd/MM/yyyy HH:mm')}
                        {entry.offer_expires_at && entry.status === 'notified' && (
                          <span className={`ml-2 px-2 py-0.5 rounded-md ${isExpiringSoon ? 'bg-orange-500/20 text-orange-400 animate-pulse' : 'bg-primary-950/50 text-primary-400'}`}>
                            · {lang === 'es' ? 'Expira' : lang === 'it' ? 'Scade' : 'Expires'} {format(parseISO(entry.offer_expires_at), 'HH:mm')}
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {!entry.clients.phone.startsWith('tg_') && (
                      <button onClick={() => openWhatsApp(entry.clients.phone)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366]/10 text-[#25D366] text-[10px] font-black uppercase tracking-wider border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all active:scale-95">
                        <MessageSquare className="h-3 w-3" />WhatsApp
                      </button>
                    )}
                    {(entry.status === 'pending' || entry.status === 'notified' || entry.status === 'offer_expired') && (
                      <button onClick={() => updateStatus(entry.id, 'resolved')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-500 text-primary-950 text-[10px] font-black uppercase tracking-wider shadow-lg shadow-accent-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <CheckCircle className="h-3 w-3" />{T.waitlist_resolve}
                      </button>
                    )}
                    <button onClick={() => deleteEntry(entry.id)} className="h-9 w-9 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 flex items-center justify-center transition-all active:scale-95">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
