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
    <div className="space-y-16 animate-in fade-in duration-1000">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12 border-b border-primary/10">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1.5 w-10 bg-primary" />
            <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.5em]">REGISTRO DE PRECISIÓN</p>
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-[#191c1e] tracking-tighter uppercase leading-none italic">
            {T.waitlist_title}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-primary/[0.03] border border-primary/10 p-1">
            <button 
              onClick={() => setFilter('active')} 
              className={`px-10 py-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${filter === 'active' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-primary/40 hover:text-primary'}`}
            >
              {T.waitlist_active}
            </button>
            <button 
              onClick={() => setFilter('all')} 
              className={`px-10 py-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${filter === 'all' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-primary/40 hover:text-primary'}`}
            >
              {T.waitlist_all}
            </button>
          </div>
          <button 
            onClick={fetchWaitlist} 
            disabled={isLoading} 
            className="h-14 w-14 bg-white border border-primary/10 flex items-center justify-center text-primary/40 hover:text-primary transition-all active:scale-95 group shadow-sm hover:border-primary/30"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin text-primary' : 'group-hover:rotate-180 transition-transform'}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-primary/[0.03] p-10 border border-primary/10 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <Clock className="h-20 w-20 text-primary" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-black text-primary/40 uppercase tracking-[0.4em] mb-2">EN ESPERA</p>
            <p className="text-5xl font-black text-primary tracking-tighter">{pendingCount}</p>
          </div>
          <div className="h-12 w-12 bg-primary/10 flex items-center justify-center text-primary relative z-10">
            <Clock className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-[#191c1e] p-10 border border-primary/10 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <Bell className="h-20 w-20 text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] mb-2">NOTIFICADOS</p>
            <p className="text-5xl font-black text-white tracking-tighter">{notifiedCount}</p>
          </div>
          <div className="h-12 w-12 bg-white/10 flex items-center justify-center text-white relative z-10">
            <Bell className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-primary/[0.03] animate-pulse border border-primary/10" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white border border-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] select-none pointer-events-none">
            <span className="text-[120px] font-black text-primary uppercase tracking-tighter italic">EMPTY</span>
          </div>
          <div className="h-24 w-24 bg-primary/[0.03] border border-primary/10 flex items-center justify-center mb-10 text-primary/20">
            <Clock className="h-12 w-12" />
          </div>
          <p className="text-sm font-black text-primary/40 uppercase tracking-[0.5em] leading-relaxed max-w-md relative z-10">
            {T.waitlist_empty}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10">
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
                className={`group relative bg-white border border-primary/10 p-10 transition-all hover:border-primary/30 hover:translate-x-2 ${isUpdating ? 'opacity-40 pointer-events-none' : ''} ${isExpiringSoon ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : ''}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-stretch gap-10">
                  {/* Status Indicator Line */}
                  <div className={`hidden lg:block w-px bg-primary/20 group-hover:bg-primary transition-colors`} />

                  <div className="flex-1">
                    <div className="flex items-center gap-6 flex-wrap mb-8">
                      <h3 className="text-3xl font-black text-[#191c1e] tracking-tighter uppercase italic group-hover:text-primary transition-colors">
                        {entry.clients.first_name} {entry.clients.last_name}
                      </h3>
                      <div className={`flex items-center gap-3 px-5 py-2 border ${statusCfg.bg.replace('/10', '/20')} border-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] shadow-sm`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusCfg.label}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/[0.03] border border-primary/10 flex items-center justify-center text-primary/40">
                          <UserCheck className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-primary/40 uppercase tracking-widest leading-none mb-1.5">PROFESIONAL</span>
                          <span className="text-[11px] font-black text-[#191c1e] uppercase tracking-tighter">{entry.professionals.full_name}</span>
                        </div>
                      </div>
                      
                      {entry.services && (
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-primary/[0.03] border border-primary/10 flex items-center justify-center text-primary/40">
                            <Layers className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-primary/40 uppercase tracking-widest leading-none mb-1.5">SERVICIO</span>
                            <span className="text-[11px] font-black text-[#191c1e] uppercase tracking-tighter">{entry.services.name}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/[0.03] border border-primary/10 flex items-center justify-center text-primary/40">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-primary/40 uppercase tracking-widest leading-none mb-1.5">{dateInfo.label}</span>
                          <span className="text-[11px] font-black text-[#191c1e] uppercase tracking-tighter">{dateInfo.value}</span>
                        </div>
                      </div>
                    </div>

                    {entry.notes && (
                      <div className="mt-10 flex items-start gap-4 p-6 bg-primary/[0.03] border border-primary/10 border-l-primary relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.02]">
                           <MessageSquare className="h-12 w-12 text-primary" />
                        </div>
                        <MessageSquare className="h-4 w-4 text-primary/30 mt-0.5 shrink-0" />
                        <p className="text-[11px] font-bold text-[#191c1e]/60 leading-relaxed uppercase tracking-tight italic">{entry.notes}</p>
                      </div>
                    )}

                    {entry.notified_at && (
                      <div className="mt-10 flex items-center gap-8 flex-wrap">
                        <div className="flex items-center gap-3 text-[10px] text-primary font-black uppercase tracking-[0.4em]">
                          <Bell className="h-4 w-4 text-primary/40 animate-pulse" />
                          NOTIFICADO EL {format(parseISO(entry.notified_at), 'dd/MM/yyyy HH:mm')}
                        </div>
                        {entry.offer_expires_at && entry.status === 'notified' && (
                          <div className={`px-5 py-2 text-[10px] font-black uppercase tracking-[0.3em] ${isExpiringSoon ? 'bg-red-600 text-white animate-pulse' : 'bg-[#191c1e] text-white'}`}>
                            EXPIRA {format(parseISO(entry.offer_expires_at), 'HH:mm')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Area */}
                  <div className="flex lg:flex-col items-stretch gap-4 shrink-0 pt-10 lg:pt-0 lg:pl-10 lg:border-l border-primary/10 w-full lg:w-48">
                    {!entry.clients.phone.startsWith('tg_') && (
                      <button 
                        onClick={() => openWhatsApp(entry.clients.phone)} 
                        className="flex-1 flex items-center justify-between px-6 py-4 bg-white border border-primary/10 text-primary transition-all hover:bg-primary/[0.03] hover:border-primary/30 active:scale-95"
                      >
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">WHATSAPP</span>
                        <MessageSquare className="h-5 w-5" />
                      </button>
                    )}
                    
                    {(entry.status === 'pending' || entry.status === 'notified' || entry.status === 'offer_expired') && (
                      <button 
                        onClick={() => updateStatus(entry.id, 'resolved')} 
                        className="flex-1 flex items-center justify-between px-6 py-4 bg-primary text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-light hover:scale-[1.02] active:scale-95"
                      >
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">{T.waitlist_resolve}</span>
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    )}

                    <button 
                      onClick={() => deleteEntry(entry.id)} 
                      className="h-14 lg:h-14 flex items-center justify-center bg-red-50 border border-red-100 text-red-400 hover:bg-red-600 hover:text-white transition-all active:scale-95"
                    >
                      <Trash2 className="h-5 w-5" />
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
