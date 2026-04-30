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
  onStatusUpdate: (id: string, status: string) => void;
  onReschedule: (app: Appointment) => void;
  lang: string;
}

export const DayActivityFeed: React.FC<DayActivityFeedProps> = ({
  selectedDate,
  appointments,
  translations: T,
  locale,
  onSelectAppointment,
  onNewAppointment,
  onStatusUpdate,
  onReschedule,
  lang
}) => {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isEditingAlerts, setIsEditingAlerts] = useState(false)
  const [medicalAlerts, setMedicalAlerts] = useState<Record<string, string>>({})
  
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
      <div className="flex items-center justify-between mb-8 px-4">
        <div>
          <h2 className="text-4xl font-black text-on-surface tracking-tighter">
            {T.today_agenda}
          </h2>
          <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.4em] mt-2">
            {format(selectedDate, "MMMM d, yyyy", { locale })}
          </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right">
              <p className="text-[10px] font-black text-on-surface/20 uppercase tracking-widest leading-none">{T.status}</p>
              <p className="text-sm font-black text-primary uppercase tracking-widest mt-1">{T.active}</p>
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
          <div className="flex-1 space-y-3 relative pl-32">
            {/* Timeline Vertical Line */}
            <div className="absolute left-[85px] top-0 bottom-0 w-0.5 bg-on-surface/5" />
            
            {appointments.map((app, index) => {
              const start = format(parseISO(app.start_at.slice(0, 19)), 'hh:mm a')
              const end = format(parseISO(app.end_at.slice(0, 19)), 'hh:mm a')
              const isActive = activeId === app.id
              const isPast = isBefore(parseISO(app.end_at.slice(0, 19)), now)

              return (
                <div key={app.id} className="relative group">
                  {/* Timeline Node */}
                  <div className={`absolute -left-32 top-1/2 -translate-y-1/2 flex items-center justify-center z-10 w-24`}>
                    <div className={`h-3 w-3 rounded-full border-2 bg-white transition-all duration-500 ${
                      isActive ? 'border-primary scale-125 shadow-lg shadow-primary/20' : 
                      isPast ? 'border-on-surface/10 bg-on-surface/5' : 'border-on-surface/10'
                    }`} />
                  </div>

                  {/* Time Marker for Active */}
                  {isActive && (
                    <div className="absolute -left-48 top-1/2 -translate-y-1/2 text-[8px] font-black text-primary uppercase tracking-widest whitespace-nowrap hidden sm:block">
                       {format(now, 'hh:mm a')} —
                    </div>
                  )}

                  {/* Hour Label */}
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-12 text-right">
                    <span className="text-[9px] font-black text-on-surface/40 uppercase tracking-widest group-hover:text-primary transition-colors">
                      {start.split(' ')[0]}
                    </span>
                  </div>

                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setActiveId(app.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                      isActive 
                        ? 'bg-white border-primary shadow-sm ring-1 ring-primary/10' 
                        : 'bg-white border-on-surface/5 hover:border-on-surface/10'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${isActive ? 'text-primary' : 'text-on-surface/20'}`}>
                        {start} - {end}
                      </span>
                      <h4 className={`text-sm font-black tracking-tight truncate ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                        {app.clients?.first_name} {app.clients?.last_name}
                      </h4>
                      <span className="text-[8px] font-bold text-on-surface/30 uppercase tracking-[0.1em] truncate">
                        {app.services?.name}
                      </span>
                    </div>

                    <div className="flex-shrink-0">
                      {isPast || app.status === 'attended' ? (
                        <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-on-surface/10" />
                      )}
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
                  {/* Card Header - Very Compact */}
                  <div className="bg-on-surface/[0.02] p-6 border-b border-on-surface/5">
                    <p className="text-[7px] font-black text-on-surface/30 uppercase tracking-[0.4em] mb-3">
                      {isBefore(parseISO(selectedApp.end_at.slice(0, 19)), now) ? T.visit_summary : T.focus_module}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white text-lg font-black shadow-lg shadow-primary/20 flex-shrink-0">
                        {selectedApp.clients?.first_name[0]}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xl font-black text-on-surface tracking-tighter truncate leading-none mb-1">
                          {selectedApp.clients?.first_name} {selectedApp.clients?.last_name}
                        </h3>
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest">
                          {format(parseISO(selectedApp.start_at.slice(0, 19)), 'hh:mm a')} • {selectedApp.services?.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Details - Dense */}
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-on-surface/5 border border-on-surface/5">
                        <p className="text-[7px] font-black text-on-surface/30 uppercase tracking-widest mb-1">{T.status}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${selectedApp.status === 'attended' ? 'text-emerald-500' : 'text-primary'}`}>
                          {selectedApp.status === 'attended' ? T.attended : T.pending}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-on-surface/5 border border-on-surface/5">
                        <p className="text-[7px] font-black text-on-surface/30 uppercase tracking-widest mb-1">{T.history}</p>
                        <p className="text-[10px] font-black text-on-surface uppercase tracking-widest">{T.system_verified}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-[7px] font-black text-on-surface/30 uppercase tracking-widest">{T.medical_record}</p>
                        <button 
                          onClick={() => setIsEditingAlerts(!isEditingAlerts)}
                          className="text-[7px] font-black text-primary hover:opacity-70 uppercase tracking-widest"
                        >
                          {isEditingAlerts ? T.done : T.edit}
                        </button>
                      </div>
                      
                      <div className={`p-4 rounded-2xl transition-all border ${isEditingAlerts ? 'bg-amber-50 border-amber-200' : 'bg-error/5 border-error/10'}`}>
                        {isEditingAlerts ? (
                          <textarea
                            autoFocus
                            value={medicalAlerts[selectedApp.clients?.id || ''] || "No known allergies. Penicillin safe."}
                            onChange={(e) => setMedicalAlerts({
                              ...medicalAlerts,
                              [selectedApp.clients?.id || '']: e.target.value
                            })}
                            className="w-full bg-transparent text-[10px] font-bold text-amber-900 focus:outline-none min-h-[60px] resize-none"
                          />
                        ) : (
                           <p className="text-[10px] font-bold text-on-surface leading-tight">
                            {medicalAlerts[selectedApp.clients?.id || ''] || "No known allergies. Penicillin safe."}
                           </p>
                        )}
                      </div>
                    </div>

                    {/* Actions - Modern & Compact */}
                    <div className="pt-2 space-y-3">
                      <button 
                        onClick={() => onSelectAppointment(selectedApp)}
                        className="w-full bg-on-surface text-white py-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-on-surface/90 transition-all"
                      >
                        {T.medical_record}
                      </button>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => onStatusUpdate(selectedApp.id, selectedApp.status === 'attended' ? 'confirmed' : 'attended')}
                          className={`py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                            selectedApp.status === 'attended' 
                              ? 'bg-on-surface/5 text-on-surface/40 border-transparent' 
                              : 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/10'
                          }`}
                        >
                          {selectedApp.status === 'attended' ? T.undo : T.mark_attended}
                        </button>
                        <button 
                          onClick={() => onReschedule(selectedApp)}
                          className="bg-orange-500 text-white py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/10"
                        >
                          {T.reschedule}
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
