"use client"

import { useState, useEffect, useCallback } from 'react'
import { Clock, CheckCircle, Trash2, MessageSquare, Calendar, UserCheck, Loader2, Bell, RefreshCw, AlertCircle, ExternalLink, User, MoreHorizontal, ArrowRight, Layers } from 'lucide-react'
import { Language, translations } from '@/lib/i18n'
import { format, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

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

  const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
    pending:       { label: T.waitlist_status_pending,       bg: 'bg-emerald-50',   text: 'text-emerald-600',   icon: Clock },
    notified:      { label: T.waitlist_status_notified,      bg: 'bg-blue-50',      text: 'text-blue-600',      icon: Bell },
    offer_expired: { label: T.waitlist_status_offer_expired, bg: 'bg-orange-50',    text: 'text-orange-600',    icon: AlertCircle },
    resolved:      { label: T.waitlist_status_resolved,      bg: 'bg-slate-50',     text: 'text-slate-400',     icon: CheckCircle },
    cancelled:     { label: T.waitlist_status_cancelled,     bg: 'bg-red-50',       text: 'text-red-400',       icon: Trash2 },
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
    if (!confirm(lang === 'es' ? '¿Eliminar de la lista?' : 'Delete from waitlist?')) return
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
    <div className="space-y-12 animate-in fade-in duration-1000">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12 border-b border-slate-50">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1.5 w-8 bg-primary rounded-full" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">REGISTRO DE ESPERA</p>
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            {T.waitlist_title}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-slate-50 rounded-[2rem] p-1.5 border border-slate-100 shadow-inner">
            <button 
              onClick={() => setFilter('active')} 
              className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'active' ? 'bg-white shadow-spatial text-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {T.waitlist_active}
            </button>
            <button 
              onClick={() => setFilter('all')} 
              className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white shadow-spatial text-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {T.waitlist_all}
            </button>
          </div>
          <button 
            onClick={fetchWaitlist} 
            disabled={isLoading} 
            className="h-14 w-14 rounded-2xl bg-white border border-slate-100 shadow-ambient flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-95"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50/50 rounded-[2.5rem] p-8 border border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">EN ESPERA</p>
            <p className="text-4xl font-black text-emerald-600">{pendingCount}</p>
          </div>
          <Clock className="h-10 w-10 text-emerald-200" />
        </div>
        <div className="bg-blue-50/50 rounded-[2.5rem] p-8 border border-blue-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest mb-1">NOTIFICADOS</p>
            <p className="text-4xl font-black text-blue-600">{notifiedCount}</p>
          </div>
          <Bell className="h-10 w-10 text-blue-200" />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-slate-50 rounded-[3rem] animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[4rem] border border-slate-100 shadow-spatial">
          <div className="h-24 w-24 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-8 text-slate-200 shadow-inner">
            <Clock className="h-12 w-12" />
          </div>
          <p className="text-xl font-black text-slate-300 uppercase tracking-widest leading-relaxed">
            {T.waitlist_empty}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {entries.map((entry, idx) => {
            const dateInfo = formatDateRange(entry)
            const statusCfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending
            const StatusIcon = statusCfg.icon
            const isUpdating = updatingId === entry.id
            const isExpiringSoon = entry.offer_expires_at && entry.status === 'notified'
              && (new Date(entry.offer_expires_at).getTime() - Date.now()) < 5 * 60 * 1000

            return (
              <motion.div 
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`group relative bg-white border border-slate-100 rounded-[3rem] p-8 transition-all hover:shadow-spatial hover:translate-x-2 ${isUpdating ? 'opacity-40 pointer-events-none' : ''} ${isExpiringSoon ? 'ring-2 ring-orange-500 ring-offset-4' : ''}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                  {/* Status Indicator Bar */}
                  <div className={`hidden lg:block w-1.5 h-16 rounded-full ${statusCfg.bg.replace('/10', '')} opacity-20`} />

                  <div className="flex-1">
                    <div className="flex items-center gap-4 flex-wrap mb-4">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                        {entry.clients.first_name} {entry.clients.last_name}
                      </h3>
                      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${statusCfg.bg} ${statusCfg.text} text-[10px] font-black uppercase tracking-widest shadow-sm`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusCfg.label}
                      </div>
                    </div>

                    <div className="flex items-center gap-8 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center">
                          <UserCheck className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{entry.professionals.full_name}</span>
                      </div>
                      
                      {entry.services && (
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center">
                            <Layers className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{entry.services.name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">{dateInfo.label}</span>
                          <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">{dateInfo.value}</span>
                        </div>
                      </div>
                    </div>

                    {entry.notes && (
                      <div className="mt-6 flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <MessageSquare className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" />
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">{entry.notes}</p>
                      </div>
                    )}

                    {entry.notified_at && (
                      <div className="mt-6 flex items-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] text-blue-500 font-black uppercase tracking-[0.2em]">
                          <Bell className="h-4 w-4" />
                          NOTIFICADO EL {format(parseISO(entry.notified_at), 'dd/MM/yyyy HH:mm')}
                        </div>
                        {entry.offer_expires_at && entry.status === 'notified' && (
                          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isExpiringSoon ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 text-white shadow-ambient'}`}>
                            EXPIRA {format(parseISO(entry.offer_expires_at), 'HH:mm')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Area */}
                  <div className="flex lg:flex-col items-center gap-3 shrink-0 pt-6 lg:pt-0 lg:pl-8 lg:border-l border-slate-50">
                    {!entry.clients.phone.startsWith('tg_') && (
                      <button 
                        onClick={() => openWhatsApp(entry.clients.phone)} 
                        className="h-14 w-14 lg:h-16 lg:w-40 flex items-center justify-center lg:justify-between px-5 bg-white border border-[#25D366]/30 text-[#25D366] rounded-2xl shadow-ambient hover:bg-[#25D366] hover:text-white transition-all group"
                      >
                        <MessageSquare className="h-6 w-6" />
                        <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">WHATSAPP</span>
                      </button>
                    )}
                    
                    {(entry.status === 'pending' || entry.status === 'notified' || entry.status === 'offer_expired') && (
                      <button 
                        onClick={() => updateStatus(entry.id, 'resolved')} 
                        className="h-14 lg:h-16 flex-1 lg:flex-none lg:w-40 flex items-center justify-center lg:justify-between px-5 bg-slate-900 text-white rounded-2xl shadow-spatial hover:bg-primary transition-all active:scale-95 group"
                      >
                        <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">{T.waitlist_resolve}</span>
                        <CheckCircle className="h-6 w-6" />
                      </button>
                    )}

                    <button 
                      onClick={() => deleteEntry(entry.id)} 
                      className="h-14 w-14 lg:h-16 lg:w-16 flex items-center justify-center bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
