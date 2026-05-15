"use client"

import { X, User, Phone, Briefcase, MessageSquare, Trash2, Calendar, Clock, ChevronRight, CheckCircle, RotateCcw, Loader2 } from 'lucide-react'
import { Appointment } from '@/hooks/useAppointments'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { useState } from 'react'

interface AppointmentDetailDrawerProps {
  appointment: Appointment;
  lang: 'en' | 'es' | 'it';
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
  translations: any;
  onReschedule: (app: Appointment) => void;
  onUpdateStatus: (id: string, status: string) => Promise<boolean>;
  onMarkAsNotified?: (id: string) => Promise<boolean>;
}

export function AppointmentDetailDrawer({
  appointment,
  lang,
  onClose,
  onSuccess,
  tenantId,
  translations: T,
  onReschedule,
  onUpdateStatus,
  onMarkAsNotified
}: AppointmentDetailDrawerProps) {
  const [updating, setUpdating] = useState(false)
  const [cancelSuccess, setCancelSuccess] = useState(false)

  const handleToggleAttended = async () => {
    setUpdating(true)
    const newStatus = appointment.status === 'attended' ? 'confirmed' : 'attended'
    const success = await onUpdateStatus(appointment.id, newStatus)
    if (success) {
      onSuccess()
    }
    setUpdating(false)
  }

  const handleMarkNotified = async () => {
    if (!onMarkAsNotified) return
    setUpdating(true)
    const success = await onMarkAsNotified(appointment.id)
    if (success) {
      onSuccess()
      onClose()
    }
    setUpdating(false)
  }

  const cancelAppointment = async () => {
    if (!confirm(T.confirm_cancel_appointment)) return
    
    try {
      setUpdating(true)
      const res = await fetch(`/api/appointments?id=${appointment.id}&tenant_id=${tenantId}`, { 
        method: 'DELETE' 
      })
      if (res.ok) {
        setCancelSuccess(true)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      } else {
        setUpdating(false)
      }
    } catch (e) {
      console.error(e)
      setUpdating(false)
    }
  }

  const getStatusLabel = (status: string) => {
    if (status === 'attended') return T.attended || 'Attended'
    if (status === 'confirmed') return T.confirmed || 'Confirmed'
    if (status === 'pending') return T.pending || 'Pending'
    if (status === 'cancelled' || status === 'canceled') return T.canceled || 'Cancelada'
    return status.replace('_', ' ')
  }

  const isCancelled = appointment.status === 'cancelled' || appointment.status === 'canceled'

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
      />

      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ 
          type: 'tween', 
          ease: [0.16, 1, 0.3, 1],
          duration: 0.6 
        }}
        className="absolute top-0 right-0 h-full w-full max-w-xl bg-surface shadow-spatial flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {cancelSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="h-24 w-24 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 shadow-spatial"
            >
              <CheckCircle className="h-12 w-12 text-emerald-500" />
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-black text-on-surface uppercase tracking-tight text-center"
            >
              {T.appointment_cancelled}
            </motion.h2>
          </div>
        ) : (
          <>
            {/* HEADER SECTION */}
            <div className="bg-precision-surface-lowest p-4 md:p-6 border-b border-on-surface/5 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center text-white text-xl font-black shadow-spatial">
                    {(appointment.clients?.first_name?.[0] || '') + (appointment.clients?.last_name?.[0] || '')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        appointment.status === 'attended' ? 'bg-emerald-500' : isCancelled ? 'bg-error' : 'bg-primary animate-pulse'
                      }`} />
                      <span className={`text-[8px] font-black tracking-[0.3em] uppercase ${isCancelled ? 'text-error' : 'text-on-surface/40'}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-on-surface tracking-tighter leading-none uppercase">
                      {appointment.clients?.first_name} <span className="text-primary italic font-serif lowercase ml-1">{appointment.clients?.last_name}</span>
                    </h2>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="h-9 w-9 flex items-center justify-center rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-muted hover:text-on-surface transition-all active:scale-95"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* BODY SECTION */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-surface">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-precision-surface-lowest p-5 rounded-2xl border border-on-surface/5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-on-surface/30">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-[8px] font-black uppercase tracking-widest">{T.date}</span>
                  </div>
                  <p className="text-base font-black text-on-surface tracking-tight">
                    {format(parseISO(appointment.start_at), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <div className="bg-precision-surface-lowest p-5 rounded-2xl border border-on-surface/5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-on-surface/30">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-[8px] font-black uppercase tracking-widest">{T.time}</span>
                  </div>
                  <p className="text-base font-black text-on-surface tracking-tight">
                    {format(parseISO(appointment.start_at), 'HH:mm')}
                  </p>
                </div>
              </div>

              {/* Appointment Info Section */}
              <section className="bg-precision-surface-lowest rounded-2xl p-5 border border-on-surface/5 space-y-4 shadow-sm">
                <h4 className="text-[8px] font-black text-on-surface/20 uppercase tracking-[0.3em] mb-2">{T.appointment_info}</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-surface border border-on-surface/5">
                    <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-on-surface-muted uppercase tracking-widest leading-none mb-1.5">{T.service}</p>
                      <p className="text-xs font-black text-on-surface leading-none uppercase">{appointment.services?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-xl bg-surface border border-on-surface/5">
                    <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-on-surface-muted uppercase tracking-widest leading-none mb-1.5">{T.professional}</p>
                      <p className="text-xs font-black text-on-surface leading-none uppercase">{appointment.professionals?.full_name || T.unassigned || 'Unassigned'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-xl bg-surface border border-on-surface/5">
                    <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-on-surface-muted uppercase tracking-widest leading-none mb-1.5">{T.contact}</p>
                      {appointment.clients?.phone ? (
                        <a href={`tel:${appointment.clients.phone}`} className="text-xs font-black text-on-surface leading-none hover:text-primary transition-colors tracking-tight">
                          {appointment.clients.phone}
                        </a>
                      ) : (
                        <p className="text-xs font-black text-on-surface/30 leading-none">{T.no_phone || 'No phone'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Notes Section */}
              {appointment.notes && (
                <section className="space-y-2">
                  <h4 className="text-[8px] font-black text-on-surface/20 uppercase tracking-[0.3em] ml-1">{T.clinical_notes}</h4>
                  <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                    <MessageSquare className="absolute -right-2 -bottom-2 h-16 w-16 text-primary/[0.03] rotate-12" />
                    <p className="text-xs font-medium text-on-surface/70 leading-relaxed italic relative z-10">
                      "{appointment.notes}"
                    </p>
                  </div>
                </section>
              )}

              {appointment.cancellation_reason && (
                <section className="space-y-2">
                  <h4 className="text-[8px] font-black text-error/40 uppercase tracking-[0.3em] ml-1">{T.cancellation_reason_title}</h4>
                  <div className="p-5 rounded-2xl bg-error/5 border border-error/10">
                    <p className="text-xs font-bold text-error/70 leading-relaxed uppercase tracking-tight">
                      {appointment.cancellation_reason}
                    </p>
                  </div>
                </section>
              )}
            </div>

            {/* FOOTER SECTION */}
            <div className="p-4 md:p-6 border-t border-on-surface/5 bg-precision-surface-lowest flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                {!isCancelled && (
                  <button 
                    onClick={cancelAppointment}
                    className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all uppercase tracking-widest shadow-sm active:scale-95"
                  >
                    <Trash2 className="h-4 w-4" />
                    {T.cancel_btn}
                  </button>
                )}
                {isCancelled && (
                   <button 
                    onClick={handleMarkNotified}
                    disabled={updating}
                    className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-all uppercase tracking-widest shadow-sm active:scale-95"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {T.mark_rescheduled_btn}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={() => onReschedule(appointment)}
                  className="flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-on-surface-muted hover:text-on-surface hover:bg-on-surface/5 transition-all"
                >
                  {T.reschedule}
                </button>
                
                {!isCancelled && (
                  <button 
                    onClick={handleToggleAttended}
                    disabled={updating}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-spatial bg-on-surface text-surface hover:bg-primary hover:text-white"
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    <span>
                      {appointment.status === 'attended' ? (T.mark_confirmed_btn || 'Confirmar') : (T.mark_attended_btn || 'Atendido')}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
