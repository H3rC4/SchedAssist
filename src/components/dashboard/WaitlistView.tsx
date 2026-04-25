"use client"

import { useState, useEffect, useCallback } from 'react'
import { Clock, CheckCircle, Trash2, Phone, MessageSquare, Calendar, UserCheck, Loader2, Bell, RefreshCw } from 'lucide-react'
import { Language, translations } from '@/lib/i18n'
import { format, parseISO } from 'date-fns'

interface WaitlistEntry {
  id: string
  tenant_id: string
  status: 'pending' | 'notified' | 'resolved' | 'cancelled'
  preferred_date?: string
  start_date?: string
  end_date?: string
  notes?: string
  notified_at?: string
  created_at: string
  clients: { id: string; first_name: string; last_name: string; phone: string }
  professionals: { id: string; full_name: string; specialty?: string }
  services?: { id: string; name: string; duration_minutes: number }
}

interface WaitlistViewProps {
  tenantId: string
  lang: Language
}

const STATUS_CONFIG = {
  pending: { label: { es: 'En Espera', en: 'Waiting', it: 'In Attesa' }, color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
  notified: { label: { es: 'Notificado', en: 'Notified', it: 'Notificato' }, color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
  resolved: { label: { es: 'Resuelto', en: 'Resolved', it: 'Risolto' }, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  cancelled: { label: { es: 'Cancelado', en: 'Cancelled', it: 'Cancellato' }, color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500' },
}

export default function WaitlistView({ tenantId, lang }: WaitlistViewProps) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'all'>('active')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const t = translations[lang] || translations['es']

  const fetchWaitlist = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = filter === 'all'
        ? `/api/waitlists?tenant_id=${tenantId}&status=all`
        : `/api/waitlists?tenant_id=${tenantId}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
      }
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
    if (entry.preferred_date) {
      return {
        label: lang === 'es' ? 'Día específico' : lang === 'it' ? 'Giorno specifico' : 'Specific day',
        value: format(parseISO(entry.preferred_date), 'dd/MM/yyyy')
      }
    }
    if (entry.start_date && entry.end_date) {
      return {
        label: lang === 'es' ? 'Rango' : lang === 'it' ? 'Intervallo' : 'Range',
        value: `${format(parseISO(entry.start_date), 'dd/MM')} → ${format(parseISO(entry.end_date), 'dd/MM/yyyy')}`
      }
    }
    return {
      label: lang === 'es' ? 'Cualquier fecha' : lang === 'it' ? 'Qualsiasi data' : 'Any date',
      value: '–'
    }
  }

  const openWhatsApp = (phone: string) => {
    const clean = phone.replace(/\D/g, '')
    window.open(`https://wa.me/${clean}`, '_blank')
  }

  const pendingCount = entries.filter(e => e.status === 'pending').length
  const notifiedCount = entries.filter(e => e.status === 'notified').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
            {lang === 'es' ? 'Lista de Espera' : lang === 'it' ? 'Lista d\'Attesa' : 'Waitlist'}
          </h2>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Clock className="h-3 w-3" />
              {pendingCount} {lang === 'es' ? 'esperando' : lang === 'it' ? 'in attesa' : 'waiting'}
            </span>
          )}
          {notifiedCount > 0 && (
            <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Bell className="h-3 w-3" />
              {notifiedCount} {lang === 'es' ? 'notificados' : lang === 'it' ? 'notificati' : 'notified'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'active' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}
            >
              {lang === 'es' ? 'Activos' : lang === 'it' ? 'Attivi' : 'Active'}
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}
            >
              {lang === 'es' ? 'Todos' : lang === 'it' ? 'Tutti' : 'All'}
            </button>
          </div>
          <button
            onClick={fetchWaitlist}
            disabled={isLoading}
            className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-95"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            {lang === 'es' ? 'No hay pacientes en lista de espera' : lang === 'it' ? 'Nessun paziente in lista d\'attesa' : 'No patients on the waitlist'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const dateInfo = formatDateRange(entry)
            const statusCfg = STATUS_CONFIG[entry.status]
            const isUpdating = updatingId === entry.id

            return (
              <div
                key={entry.id}
                className={`bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-all hover:shadow-md ${isUpdating ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Patient info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {entry.clients.first_name} {entry.clients.last_name}
                      </p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${statusCfg.color}`}>
                        {statusCfg.label[lang]}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                        <UserCheck className="h-3 w-3" />
                        {entry.professionals.full_name}
                      </span>
                      {entry.services && (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                          <CheckCircle className="h-3 w-3" />
                          {entry.services.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                        <Calendar className="h-3 w-3" />
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{dateInfo.label}:</span>
                        {dateInfo.value}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="mt-1.5 text-[11px] text-slate-400 italic truncate">{entry.notes}</p>
                    )}
                    {entry.notified_at && (
                      <p className="mt-1 text-[10px] text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        {lang === 'es' ? 'Notificado el' : lang === 'it' ? 'Notificato il' : 'Notified on'} {format(parseISO(entry.notified_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {!entry.clients.phone.startsWith('tg_') && (
                      <button
                        onClick={() => openWhatsApp(entry.clients.phone)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors active:scale-95"
                      >
                        <MessageSquare className="h-3 w-3" />
                        WhatsApp
                      </button>
                    )}
                    {(entry.status === 'pending' || entry.status === 'notified') && (
                      <button
                        onClick={() => updateStatus(entry.id, 'resolved')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
                      >
                        <CheckCircle className="h-3 w-3" />
                        {lang === 'es' ? 'Resolver' : lang === 'it' ? 'Risolvi' : 'Resolve'}
                      </button>
                    )}
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="h-8 w-8 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center transition-colors active:scale-95"
                    >
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
