"use client"

import { X, User, Phone, Briefcase, MessageSquare, Trash2, Calendar, Clock } from 'lucide-react'
import { Appointment } from '@/hooks/useAppointments'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'

interface AppointmentDetailModalProps {
  appointment: Appointment;
  onClose: () => void;
  onCancel: (id: string) => void;
  translations: any;
}

export function AppointmentDetailModal({
  appointment,
  onClose,
  onCancel,
  translations: T
}: AppointmentDetailModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-on-surface/20 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-2xl bg-surface h-full shadow-spatial p-12 md:p-20 overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-12 right-12 p-4 bg-on-surface/5 rounded-full hover:bg-on-surface/10 transition-all group"
        >
          <X className="h-6 w-6 text-on-surface group-hover:rotate-90 transition-transform" />
        </button>

        <div className="mb-20">
          <div className="flex items-center gap-4 mb-8">
             <div className="h-2 w-2 rounded-full bg-primary" />
             <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.4em]">Event Intelligence</p>
          </div>
          
          <h2 className="precision-header mb-8">
            {appointment.clients?.first_name} <br />
            <span className="text-primary italic font-medium">{appointment.clients?.last_name}</span>
          </h2>
          
          <div className="flex flex-wrap gap-4">
             <div className="px-6 py-3 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
                {appointment.services?.name}
             </div>
             <div className="px-6 py-3 rounded-full bg-on-surface/5 text-on-surface/40 text-[10px] font-black uppercase tracking-widest">
                ID: {appointment.id.slice(0, 8)}
             </div>
          </div>
        </div>

        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="precision-surface-lowest p-10 rounded-[3rem]">
                <p className="text-[10px] font-black text-on-surface/20 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <Calendar className="h-4 w-4" /> Schedule
                </p>
                <p className="text-2xl font-black text-on-surface tracking-tighter">
                   {format(parseISO(appointment.start_at), 'MMMM dd')}
                </p>
                <p className="text-sm font-bold text-on-surface/40 mt-1 uppercase tracking-widest">
                   {format(parseISO(appointment.start_at), 'yyyy')}
                </p>
             </div>
             <div className="precision-surface-lowest p-10 rounded-[3rem]">
                <p className="text-[10px] font-black text-on-surface/20 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <Clock className="h-4 w-4" /> Temporal Slot
                </p>
                <p className="text-2xl font-black text-on-surface tracking-tighter">
                   {format(parseISO(appointment.start_at), 'HH:mm')} - {format(parseISO(appointment.end_at), 'HH:mm')}
                </p>
                <p className="text-sm font-bold text-on-surface/40 mt-1 uppercase tracking-widest">
                   Synchronized Slot
                </p>
             </div>
          </div>

          <div className="space-y-6">
            {[
              { icon: Phone, label: T.phone, val: appointment.clients?.phone },
              { icon: Briefcase, label: T.professional, val: appointment.professionals?.full_name },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="flex items-center gap-8 p-10 rounded-[3.5rem] bg-on-surface/5 border border-on-surface/5">
                <div className="h-16 w-16 rounded-[2rem] bg-white flex items-center justify-center shadow-spatial">
                   <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-on-surface/20 uppercase tracking-widest mb-2">{label}</p>
                  <p className="text-xl font-black text-on-surface tracking-tight">{val}</p>
                </div>
              </div>
            ))}
          </div>

          {appointment.notes && (
            <div className="p-12 rounded-[4rem] bg-primary/5 border border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <MessageSquare className="h-20 w-20 text-primary" />
              </div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                 <MessageSquare className="h-4 w-4" /> {T.notes}
              </p>
              <p className="text-xl font-medium text-on-surface italic leading-relaxed">
                "{appointment.notes}"
              </p>
            </div>
          )}

          <div className="pt-12 border-t border-on-surface/10">
            <button 
              onClick={() => onCancel(appointment.id)}
              className="w-full py-8 bg-error/5 text-error font-black rounded-full hover:bg-error hover:text-white transition-all duration-500 flex items-center justify-center gap-4 uppercase tracking-[0.3em] text-[10px]"
            >
              <Trash2 className="h-5 w-5" /> {T.cancelBtn}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
