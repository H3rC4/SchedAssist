"use client"

import { X, User, Phone, Briefcase, MessageSquare, Trash2, Calendar, Clock, ChevronRight, CheckCircle, RotateCcw } from 'lucide-react'
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
    <div className="fixed inset-0 z-[100] flex justify-end" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-[2px]"
      />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-md bg-surface h-full shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {cancelSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircle className="h-10 w-10 text-emerald-500" />
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
            {/* Header - Compact */}
            <div className="p-6 pb-4 flex items-start justify-between bg-on-surface/[0.02] border-b border-on-surface/5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-1.5 w-1.5 rounded-full ${
                appointment.status === 'attended' ? 'bg-emerald-500' : isCancelled ? 'bg-error' : 'bg-primary animate-pulse'
              }`} />
              <span className={`text-[8px] font-black tracking-[0.3em] uppercase ${isCancelled ? 'text-error' : 'text-on-surface/40'}`}>
                {getStatusLabel(appointment.status)}
              </span>
            </div>
            <h2 className="text-xl font-black text-on-surface tracking-tighter uppercase leading-none">
              {appointment.clients?.first_name} <span className="text-primary italic font-serif lowercase ml-1">{appointment.clients?.last_name}</span>
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-on-surface/5 rounded-full transition-all"
          >
            <X className="h-4 w-4 text-on-surface/40" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-on-surface/5 p-4 rounded-2xl border border-on-surface/5">
              <div className="flex items-center gap-2 mb-2 text-on-surface/30">
                <Calendar className="h-3 w-3" />
                <span className="text-[8px] font-black uppercase tracking-widest">{T.date}</span>
              </div>
              <p className="text-sm font-black text-on-surface">
                {format(parseISO(appointment.start_at), 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="bg-on-surface/5 p-4 rounded-2xl border border-on-surface/5">
              <div className="flex items-center gap-2 mb-2 text-on-surface/30">
                <Clock className="h-3 w-3" />
                <span className="text-[8px] font-black uppercase tracking-widest">{T.time}</span>
              </div>
              <p className="text-sm font-black text-on-surface">
                {format(parseISO(appointment.start_at), 'HH:mm')}
              </p>
            </div>
          </div>

          {/* Details - Compact Grid */}
          <div className="space-y-3">
            <h4 className="text-[8px] font-black text-on-surface/20 uppercase tracking-[0.3em] ml-1">{T.appointment_info}</h4>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-on-surface/[0.02] border border-on-surface/5">
                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[7px] font-black text-on-surface/30 uppercase tracking-widest leading-none mb-1">{T.service}</p>
                  <p className="text-[11px] font-black text-on-surface leading-none">{appointment.services?.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-on-surface/[0.02] border border-on-surface/5">
                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[7px] font-black text-on-surface/30 uppercase tracking-widest leading-none mb-1">{T.professional}</p>
                  <p className="text-[11px] font-black text-on-surface leading-none">{appointment.professionals?.full_name || T.unassigned || 'Unassigned'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-on-surface/[0.02] border border-on-surface/5">
                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[7px] font-black text-on-surface/30 uppercase tracking-widest leading-none mb-1">{T.contact}</p>
                  {appointment.clients?.phone ? (
                    <a href={`tel:${appointment.clients.phone}`} className="text-[11px] font-black text-on-surface leading-none hover:text-primary transition-colors">
                      {appointment.clients.phone}
                    </a>
                  ) : (
                    <p className="text-[11px] font-black text-on-surface/30 leading-none">{T.no_phone || 'No phone'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes - Compact */}
          {appointment.notes && (
            <div className="space-y-2">
              <h4 className="text-[8px] font-black text-on-surface/20 uppercase tracking-[0.3em] ml-1">{T.clinical_notes}</h4>
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-medium text-on-surface/70 leading-relaxed italic">
                  "{appointment.notes}"
                </p>
              </div>
            </div>
          )}

          {appointment.cancellation_reason && (
            <div className="space-y-2">
              <h4 className="text-[8px] font-black text-error/40 uppercase tracking-[0.3em] ml-1">{T.cancellation_reason_title}</h4>
              <div className="p-4 rounded-2xl bg-error/5 border border-error/10">
                <p className="text-[10px] font-bold text-error/70 leading-relaxed">
                  {appointment.cancellation_reason}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-on-surface/[0.02] border-t border-on-surface/5 space-y-3">
          <div className="flex flex-col gap-3">
            {isCancelled && (
              <button 
                onClick={handleMarkNotified}
                disabled={updating}
                className="w-full py-4 rounded-xl bg-primary text-white font-black text-[9px] uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <CheckCircle className="h-3.5 w-3.5" /> {T.mark_rescheduled_btn}
              </button>
            )}

            {!isCancelled && (
              <button 
                onClick={handleToggleAttended}
                disabled={updating}
                className="w-full py-4 rounded-xl bg-emerald-500 text-white font-black text-[9px] uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle className="h-3.5 w-3.5" /> 
                {appointment.status === 'attended' ? (T.mark_confirmed_btn || 'Mark as Confirmed') : (T.mark_attended_btn || 'Mark as Attended')}
              </button>
            )}

            <button 
              onClick={() => onReschedule(appointment)}
              className="w-full py-4 rounded-xl bg-primary text-white font-black text-[9px] uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {T.reschedule}
            </button>
          </div>

          {!isCancelled && (
            <button 
              onClick={cancelAppointment}
              className="w-full py-4 rounded-xl bg-error/5 text-error font-black text-[9px] uppercase tracking-[0.2em] hover:bg-error hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="h-3.5 w-3.5" /> {T.cancel_btn}
            </button>
          )}
        </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
