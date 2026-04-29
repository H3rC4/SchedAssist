"use client"

import { X, User, Phone, Briefcase, MessageSquare, Trash2, Calendar, Clock, ChevronRight } from 'lucide-react'
import { Appointment } from '@/hooks/useAppointments'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'

interface AppointmentDetailDrawerProps {
  appointment: Appointment;
  lang: 'en' | 'es' | 'it';
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
}

export function AppointmentDetailDrawer({
  appointment,
  lang,
  onClose,
  onSuccess,
  tenantId
}: AppointmentDetailDrawerProps) {
  const cancelAppointment = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return
    
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
        className="relative w-full max-w-xl bg-surface h-full shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 md:p-12 pb-0 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className={`h-2 w-2 rounded-full ${
                appointment.status === 'confirmed' ? 'bg-success' : 'bg-warning animate-pulse'
              }`} />
              <span className="text-[10px] font-black tracking-[0.4em] text-on-surface/40 uppercase">
                {appointment.status?.replace('_', ' ')}
              </span>
            </div>
            <h2 className="precision-header text-4xl leading-tight">
              {appointment.clients?.first_name} <br />
              <span className="text-primary italic font-serif">
                {appointment.clients?.last_name}
              </span>
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-on-surface/5 rounded-full hover:bg-on-surface/10 transition-colors group"
          >
            <X className="h-5 w-5 text-on-surface/40 group-hover:text-on-surface group-hover:rotate-90 transition-all" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 custom-scrollbar">
          {/* Time & Date Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-on-surface/2 p-8 rounded-[2rem] border border-on-surface/5">
              <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Date
              </p>
              <p className="text-2xl font-black text-on-surface tracking-tighter">
                {format(parseISO(appointment.start_at), 'MMM dd')}
              </p>
            </div>
            <div className="bg-on-surface/2 p-8 rounded-[2rem] border border-on-surface/5">
              <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock className="h-3 w-3" /> Time
              </p>
              <p className="text-2xl font-black text-on-surface tracking-tighter">
                {format(parseISO(appointment.start_at), 'HH:mm')}
              </p>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-6">
            <div className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-on-surface/5 border border-on-surface/5 group hover:bg-white hover:shadow-xl hover:shadow-on-surface/5 transition-all">
              <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest mb-1">Service</p>
                <p className="text-lg font-black text-on-surface tracking-tight">{appointment.services?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-on-surface/5 border border-on-surface/5 group hover:bg-white hover:shadow-xl hover:shadow-on-surface/5 transition-all">
              <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest mb-1">Professional</p>
                <p className="text-lg font-black text-on-surface tracking-tight">{appointment.professionals?.full_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-on-surface/5 border border-on-surface/5 group hover:bg-white hover:shadow-xl hover:shadow-on-surface/5 transition-all">
              <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest mb-1">Contact</p>
                <p className="text-lg font-black text-on-surface tracking-tight">{appointment.clients?.phone}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="p-10 rounded-[3rem] bg-primary/5 border border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <MessageSquare className="h-20 w-20 text-primary" />
              </div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <MessageSquare className="h-3 w-3" /> Notes
              </p>
              <p className="text-lg font-medium text-on-surface italic leading-relaxed relative z-10">
                "{appointment.notes}"
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-8 md:p-12 border-t border-on-surface/5 bg-surface/80 backdrop-blur-md">
          <button 
            onClick={cancelAppointment}
            className="w-full py-6 rounded-full bg-error/5 text-error font-black text-[10px] uppercase tracking-[0.4em] hover:bg-error hover:text-white transition-all duration-500 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <Trash2 className="h-4 w-4" /> Cancel Appointment
          </button>
        </div>
      </motion.div>
    </div>
  )
}
