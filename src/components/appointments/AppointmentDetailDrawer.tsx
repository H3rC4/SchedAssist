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
}

export function AppointmentDetailDrawer({
  appointment,
  lang,
  onClose,
  onSuccess,
  tenantId,
  translations: T,
  onReschedule,
  onUpdateStatus
}: AppointmentDetailDrawerProps) {
  const [updating, setUpdating] = useState(false)

  const handleToggleAttended = async () => {
    setUpdating(true)
    const newStatus = appointment.status === 'attended' ? 'confirmed' : 'attended'
    const success = await onUpdateStatus(appointment.id, newStatus)
    if (success) {
      onSuccess()
    }
    setUpdating(false)
  }

  const cancelAppointment = async () => {
    if (!confirm(T.confirm_cancel_appointment || 'Are you sure you want to cancel this appointment?')) return
    
    try {
      const res = await fetch(`/api/appointments?id=${appointment.id}&tenant_id=${tenantId}`, { 
        method: 'DELETE' 
      })
      if (res.ok) {
        onSuccess()
        onClose()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusLabel = (status: string) => {
    if (status === 'attended') return T.attended || 'Attended'
    if (status === 'confirmed') return T.confirmed || 'Confirmed'
    if (status === 'pending') return T.pending || 'Pending'
    if (status === 'canceled') return T.canceled || 'Canceled'
    return status.replace('_', ' ')
  }

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
        {/* Header - Compact */}
        <div className="p-6 pb-4 flex items-start justify-between bg-on-surface/[0.02] border-b border-on-surface/5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-1.5 w-1.5 rounded-full ${
                appointment.status === 'attended' ? 'bg-emerald-500' : 'bg-primary animate-pulse'
              }`} />
              <span className="text-[8px] font-black tracking-[0.3em] text-on-surface/40 uppercase">
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
                  <p className="text-[11px] font-black text-on-surface leading-none">{appointment.professionals?.full_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-on-surface/[0.02] border border-on-surface/5">
                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[7px] font-black text-on-surface/30 uppercase tracking-widest leading-none mb-1">{T.contact}</p>
                  <a href={`tel:${appointment.clients?.phone}`} className="text-[11px] font-black text-on-surface leading-none hover:text-primary transition-colors">
                    {appointment.clients?.phone}
                  </a>
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
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-on-surface/[0.02] border-t border-on-surface/5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleToggleAttended}
              disabled={updating}
              className={`py-4 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 border overflow-hidden ${
                appointment.status === 'attended' 
                  ? 'bg-emerald-500 text-white border-emerald-600 scale-[0.98]' 
                  : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50'
              }`}
            >
              <AnimatePresence mode="wait">
                {appointment.status === 'attended' ? (
                  <motion.div key="undo" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5" /> 
                    {T.undo || 'DESHACER'}
                  </motion.div>
                ) : (
                  <motion.div key="mark" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5" /> 
                    {T.mark_attended}
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <button 
              onClick={() => onReschedule(appointment)}
              className="py-4 rounded-xl bg-primary text-white font-black text-[9px] uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {T.reschedule}
            </button>
          </div>

          <button 
            onClick={cancelAppointment}
            className="w-full py-4 rounded-xl bg-error/5 text-error font-black text-[9px] uppercase tracking-[0.2em] hover:bg-error hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="h-3.5 w-3.5" /> {T.cancel_btn}
          </button>
          
          <button 
            onClick={onClose}
            className="w-full py-2 text-[9px] font-black text-on-surface/30 uppercase tracking-[0.2em] hover:text-on-surface transition-all"
          >
            {T.close_viewer}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
