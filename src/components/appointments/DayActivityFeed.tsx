"use client"

import React from 'react'
import { Calendar, Stethoscope, Clock, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Appointment } from '@/hooks/useAppointments'
import { motion } from 'framer-motion'

interface DayActivityFeedProps {
  selectedDate: Date;
  appointments: Appointment[];
  translations: any;
  locale: any;
  onSelectAppointment: (app: Appointment) => void;
  onNewAppointment: () => void;
  lang: string;
}

export const DayActivityFeed: React.FC<DayActivityFeedProps> = ({
  selectedDate,
  appointments,
  translations: T,
  locale,
  onSelectAppointment,
  onNewAppointment,
  lang
}) => {
  return (
    <div className="min-h-[600px]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
        <div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4"
          >
            {T.dailyView}
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-on-surface tracking-tighter capitalize"
          >
            {format(selectedDate, "EEEE d", { locale })} <br />
            <span className="text-on-surface/20 font-medium italic">{format(selectedDate, "MMMM", { locale })}</span>
          </motion.h2>
        </div>
        
        <div className="flex flex-col items-end gap-2">
           <div className="text-6xl font-black text-on-surface/5 leading-none">
             {appointments.length.toString().padStart(2, '0')}
           </div>
           <div className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">
             Registered Events
           </div>
        </div>
      </div>

      {appointments.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-40 text-center precision-surface-lowest rounded-[4rem]"
        >
          <div className="h-24 w-24 rounded-full bg-surface flex items-center justify-center mb-10">
            <Calendar className="h-10 w-10 text-on-surface/10" />
          </div>
          <p className="text-xl font-black text-on-surface/20 uppercase tracking-widest">{T.noActivity}</p>
          <button 
            onClick={onNewAppointment} 
            className="mt-8 text-[10px] font-black text-primary hover:tracking-[0.4em] transition-all duration-500 uppercase flex items-center gap-4"
          >
            {T.createFirst} <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {appointments.map((app, index) => (
            <motion.button 
              key={app.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelectAppointment(app)}
              className="flex flex-col p-12 rounded-[3.5rem] bg-white border border-on-surface/5 hover:border-primary/20 hover:shadow-spatial transition-all duration-500 text-left group relative"
            >
              <div className={`absolute left-0 top-12 bottom-12 w-1.5 rounded-r-full transition-all group-hover:w-3 ${
                app.status === 'needs_rescheduling' ? 'bg-error' :
                app.status === 'confirmed' ? 'bg-primary' : 
                app.status === 'awaiting_confirmation' ? 'bg-warning' : 
                'bg-primary/40'
              }`} />
              
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-[1.5rem] bg-on-surface/5 flex items-center justify-center text-on-surface font-black text-sm">
                    {format(parseISO(app.start_at.slice(0, 19)), 'HH:mm')}
                  </div>
                  <span className="text-[10px] font-black text-on-surface/20 uppercase tracking-widest">
                    {format(parseISO(app.end_at.slice(0, 19)), 'HH:mm')}hs
                  </span>
                </div>
                
                <div className={`h-3 w-3 rounded-full ${
                   app.status === 'needs_rescheduling' ? 'bg-error animate-pulse' :
                   app.status === 'awaiting_confirmation' ? 'bg-warning' : 
                   'bg-primary'
                }`} />
              </div>

              <div className="mb-8">
                 <p className="text-[10px] font-black text-on-surface/20 uppercase tracking-[0.3em] mb-2">Patient</p>
                 <p className="text-3xl font-black text-on-surface tracking-tighter group-hover:text-primary transition-colors">
                   {app.clients?.first_name} <br />
                   {app.clients?.last_name}
                 </p>
              </div>

              <div className="flex items-center gap-4 pt-8 border-t border-on-surface/5 mt-auto">
                 <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center">
                    <Stethoscope className="h-4 w-4 text-primary" />
                 </div>
                 <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] truncate">
                   {app.services?.name}
                 </p>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}
