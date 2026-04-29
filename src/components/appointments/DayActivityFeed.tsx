"use client"

import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Stethoscope, 
  Clock, 
  ChevronRight, 
  User, 
  Activity, 
  History,
  CheckCircle2,
  CalendarClock
} from 'lucide-react'
import { format, parseISO, isAfter, isBefore, addMinutes } from 'date-fns'
import { Appointment } from '@/hooks/useAppointments'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [activeId, setActiveId] = useState<string | null>(null)
  
  // Logic to find "Next Patient"
  const now = new Date()
  const nextApp = appointments.find(app => {
    const start = parseISO(app.start_at.slice(0, 19))
    const end = parseISO(app.end_at.slice(0, 19))
    return isAfter(end, now) || (isBefore(start, now) && isAfter(end, now))
  }) || appointments[0]

  useEffect(() => {
    if (nextApp) setActiveId(nextApp.id)
  }, [nextApp])

  const selectedApp = appointments.find(a => a.id === activeId) || nextApp

  return (
    <div className="min-h-screen bg-surface">
      {/* Editorial Header */}
      <div className="flex items-center justify-between mb-16 px-4">
        <div>
          <h2 className="text-4xl font-black text-on-surface tracking-tighter">
            {T.today_agenda || "Today's Agenda"}
          </h2>
          <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.4em] mt-2">
            {format(selectedDate, "MMMM d, yyyy", { locale })}
          </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right">
              <p className="text-[10px] font-black text-on-surface/20 uppercase tracking-widest leading-none">Status</p>
              <p className="text-sm font-black text-primary uppercase tracking-widest mt-1">Operational</p>
           </div>
           <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
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
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Timeline Column */}
          <div className="flex-1 space-y-2 relative pl-16">
            {/* Timeline Vertical Line */}
            <div className="absolute left-[39px] top-0 bottom-0 w-0.5 bg-on-surface/5" />
            
            {appointments.map((app, index) => {
              const start = format(parseISO(app.start_at.slice(0, 19)), 'hh:mm a')
              const end = format(parseISO(app.end_at.slice(0, 19)), 'hh:mm a')
              const isActive = activeId === app.id
              const isPast = isBefore(parseISO(app.end_at.slice(0, 19)), now)

              return (
                <div key={app.id} className="relative group">
                  {/* Timeline Node */}
                  <div className={`absolute -left-16 top-1/2 -translate-y-1/2 flex items-center justify-center z-10`}>
                    <div className={`h-4 w-4 rounded-full border-4 bg-white transition-all duration-500 ${
                      isActive ? 'border-primary scale-125 shadow-lg shadow-primary/20' : 
                      isPast ? 'border-on-surface/10 bg-on-surface/5' : 'border-on-surface/10'
                    }`} />
                  </div>

                  {/* Time Marker for Active */}
                  {isActive && (
                    <div className="absolute -left-32 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary uppercase tracking-widest whitespace-nowrap">
                       {format(now, 'hh:mm a')} —
                    </div>
                  )}

                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setActiveId(app.id)}
                    className={`w-full text-left p-8 rounded-[2rem] border transition-all duration-500 flex items-center justify-between gap-6 ${
                      isActive 
                        ? 'bg-white border-primary shadow-spatial ring-4 ring-primary/5' 
                        : 'bg-white border-on-surface/5 hover:border-on-surface/20'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isActive ? 'text-primary' : 'text-on-surface/30'}`}>
                        {start} - {end}
                      </span>
                      <h4 className={`text-xl font-black tracking-tighter ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                        {app.clients?.first_name} {app.clients?.last_name}
                      </h4>
                      <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-[0.2em] mt-1">
                        {app.services?.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        isPast ? 'text-emerald-500' : 'text-on-surface/20'
                      }`}>
                        {isPast ? (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3" /> Attended
                          </span>
                        ) : 'Upcoming'}
                      </span>
                    </div>
                  </motion.button>
                </div>
              )
            })}
          </div>

          {/* Next Patient Card Column */}
          <div className="lg:w-[450px]">
            <AnimatePresence mode="wait">
              {selectedApp && (
                <motion.div
                  key={selectedApp.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[3rem] border border-on-surface/5 shadow-spatial overflow-hidden sticky top-8"
                >
                  {/* Card Header */}
                  <div className="bg-primary/5 p-8 border-b border-on-surface/5">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">
                      {isBefore(parseISO(selectedApp.end_at.slice(0, 19)), now) ? "Patient Summary" : "Next Patient"}
                    </p>
                    <div className="flex items-center gap-6">
                      <div className="h-20 w-20 rounded-[2rem] bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-primary/20">
                        {selectedApp.clients?.first_name[0]}
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-on-surface tracking-tighter">
                          {selectedApp.clients?.first_name} {selectedApp.clients?.last_name}
                        </h3>
                        <p className="text-lg font-bold text-primary tracking-tight">
                          {format(parseISO(selectedApp.start_at.slice(0, 19)), 'hh:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-8 space-y-8">
                    <div>
                      <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest mb-3">Reason for Visit</p>
                      <p className="text-sm font-bold text-on-surface leading-relaxed">
                        {selectedApp.notes || selectedApp.services?.name || "Regular check-up and follow-up consultation."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 py-8 border-y border-on-surface/5">
                      <div>
                        <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest mb-1">Age</p>
                        <p className="text-xl font-black text-on-surface">45 <span className="text-xs font-medium text-on-surface/30">years</span></p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-sm font-black text-emerald-500 uppercase tracking-widest">Normal</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest mb-3">Vitals (Latest)</p>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-on-surface">120/80 <span className="text-[10px] opacity-40">BP</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <History className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-on-surface">72 <span className="text-[10px] opacity-40">BPM</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 space-y-4">
                      <button 
                        onClick={() => onSelectAppointment(selectedApp)}
                        className="w-full bg-primary text-white py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary/20"
                      >
                        Open Medical Record Drawer
                      </button>
                      <div className="grid grid-cols-2 gap-4">
                        <button className="bg-emerald-500 text-white py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">
                          Mark as Attended
                        </button>
                        <button className="bg-warning text-white py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all">
                          Reschedule
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
