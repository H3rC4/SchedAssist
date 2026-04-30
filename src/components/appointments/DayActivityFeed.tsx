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
import { format, parseISO, isAfter, isBefore, addMinutes, isPast } from 'date-fns'
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
  const [currentTime, setCurrentTime] = useState(new Date())
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Logic to find "Next Patient"
  const now = currentTime
  const nextApp = appointments.find(app => {
    const start = parseISO(app.start_at.slice(0, 19))
    const end = parseISO(app.end_at.slice(0, 19))
    return isAfter(end, now) || (isBefore(start, now) && isAfter(end, now))
  }) || appointments[0]

  useEffect(() => {
    if (nextApp && !activeId) setActiveId(nextApp.id)
  }, [nextApp, activeId])

  const selectedApp = appointments.find(a => a.id === activeId) || nextApp

  // Calculate timeline position for current time
  // We assume a linear timeline from 08:00 to 20:00 for the indicator position
  const getTimelineTop = () => {
    const hours = now.getHours()
    const minutes = now.getMinutes()
    if (hours < 8) return 0
    if (hours >= 20) return 100
    return ((hours - 8) * 60 + minutes) / (12 * 60) * 100
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Editorial Header */}
      <div className="flex items-end justify-between mb-12 px-4">
        <div>
          <h2 className="text-5xl font-black text-on-surface tracking-tighter leading-none mb-3">
            {T.today_agenda}
          </h2>
          <div className="flex items-center gap-3">
            <Calendar className="h-3 w-3 text-primary" />
            <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.3em]">
              {format(selectedDate, "MMMM d, yyyy", { locale })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 pb-1">
           <div className="text-right">
              <p className="text-[8px] font-black text-on-surface/20 uppercase tracking-[0.3em] leading-none mb-1">{T.status || 'STATUS'}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">{T.operative || 'OPERATIVO'}</span>
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
           </div>
        </div>
      </div>

      {appointments.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-40 text-center bg-on-surface/[0.02] rounded-[4rem] border border-on-surface/5"
        >
          <div className="h-20 w-20 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-10 rotate-3">
            <CalendarClock className="h-8 w-8 text-on-surface/10" />
          </div>
          <p className="text-xl font-black text-on-surface/20 uppercase tracking-widest">{T.noActivity}</p>
          <button 
            onClick={onNewAppointment} 
            className="mt-8 px-8 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
          >
            {T.createFirst}
          </button>
        </motion.div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-16 relative">
          {/* Timeline Column */}
          <div className="flex-1 relative">
            {/* Vertical Thread (Hilo) */}
            <div className="absolute left-[80px] top-4 bottom-4 w-[1.5px] bg-on-surface/[0.08] rounded-full" />
            
            {/* Current Time Indicator */}
            {isSameDay(selectedDate, now) && (
              <div 
                className="absolute left-0 right-0 z-20 flex items-center pointer-events-none transition-all duration-1000"
                style={{ top: `${getTimelineTop()}%` }}
              >
                <div className="w-[75px] text-right pr-3">
                  <span className="text-[10px] font-black text-primary bg-white px-1.5 py-0.5 rounded-md shadow-sm">
                    {format(now, 'HH:mm')}
                  </span>
                </div>
                <div className="h-[2px] flex-1 bg-primary/20 relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-primary border-2 border-white shadow-sm" />
                </div>
              </div>
            )}

            <div className="space-y-4 pl-[120px]">
              {appointments.map((app, index) => {
                const startDate = parseISO(app.start_at.slice(0, 19))
                const endDate = parseISO(app.end_at.slice(0, 19))
                const start = format(startDate, 'HH:mm')
                const end = format(endDate, 'HH:mm')
                const isActive = activeId === app.id
                const isPast = isBefore(endDate, now)
                const isOngoing = isBefore(startDate, now) && isAfter(endDate, now)

                return (
                  <div key={app.id} className="relative">
                    {/* Timeline Node Point */}
                    <div className="absolute -left-[45px] top-1/2 -translate-y-1/2 z-10">
                      <div className={`h-4 w-4 rounded-full border-2 transition-all duration-500 flex items-center justify-center ${
                        isActive ? 'bg-primary border-white ring-4 ring-primary/10 shadow-lg' : 
                        isPast ? 'bg-on-surface/10 border-white' : 'bg-white border-on-surface/20'
                      }`}>
                        {isPast && <CheckCircle2 className="h-2 w-2 text-white" />}
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setActiveId(app.id)}
                      className={`group w-full max-w-[95%] text-left p-5 rounded-[2rem] border transition-all duration-500 cursor-pointer relative overflow-hidden ${
                        isActive 
                          ? 'bg-white border-primary shadow-xl shadow-primary/5 -translate-y-1' 
                          : isOngoing
                          ? 'bg-primary/[0.02] border-primary/20'
                          : 'bg-white border-on-surface/5 hover:border-on-surface/20 hover:shadow-lg'
                      }`}
                    >
                      {/* Status Indicator */}
                      <div className="absolute right-6 top-6 flex items-center gap-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${
                          app.status === 'attended' ? 'text-emerald-500' : 
                          isOngoing ? 'text-primary animate-pulse' : 'text-on-surface/20'
                        }`}>
                          {app.status === 'attended' ? T.attended : isOngoing ? T.ongoing || 'EN CURSO' : T.upcoming || 'PRÓXIMA'}
                        </span>
                        {app.status === 'attended' && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                           <Clock className={`h-3 w-3 ${isActive ? 'text-primary' : 'text-on-surface/20'}`} />
                           <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-primary' : 'text-on-surface/30'}`}>
                             {start} — {end}
                           </span>
                        </div>
                        
                        <h4 className={`text-xl font-black tracking-tighter mb-1 transition-colors ${isActive ? 'text-on-surface' : 'text-on-surface/80 group-hover:text-on-surface'}`}>
                          {app.clients?.first_name} <span className="text-primary italic font-serif lowercase ml-0.5">{app.clients?.last_name}</span>
                        </h4>
                        
                        <div className="flex items-center gap-3">
                          <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">
                            {app.services?.name}
                          </p>
                          <div className="h-1 w-1 rounded-full bg-on-surface/10" />
                          <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">
                            Dr. {app.professionals?.full_name?.split(' ').pop()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Next Patient Card Column */}
          <div className="lg:w-[480px]">
            <AnimatePresence mode="wait">
              {selectedApp && (
                <motion.div
                  key={selectedApp.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-[3.5rem] border border-on-surface/5 shadow-2xl overflow-hidden sticky top-8"
                >
                  {/* Card Header */}
                  <div className="bg-primary/5 p-8 border-b border-primary/5 relative">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                      <Stethoscope className="h-24 w-24 -rotate-12" />
                    </div>
                    
                    <p className="text-[8px] font-black text-primary uppercase tracking-[0.4em] mb-6">
                      {isPast(parseISO(selectedApp.end_at.slice(0, 19))) ? T.visit_summary : T.next_patient || 'PACIENTE EN ENFOQUE'}
                    </p>
                    
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="h-20 w-20 rounded-[2rem] bg-white flex items-center justify-center text-primary text-3xl font-black shadow-xl shadow-primary/10 flex-shrink-0 border border-primary/5">
                        {selectedApp.clients?.first_name[0]}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-3xl font-black text-on-surface tracking-tighter truncate leading-tight">
                          {selectedApp.clients?.first_name} {selectedApp.clients?.last_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                           <Clock className="h-3 w-3 text-primary" />
                           <p className="text-sm font-black text-primary uppercase tracking-widest">
                             {format(parseISO(selectedApp.start_at.slice(0, 19)), 'HH:mm')}
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-8 space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-3xl bg-on-surface/[0.02] border border-on-surface/5">
                        <p className="text-[8px] font-black text-on-surface/20 uppercase tracking-[0.2em] mb-2">{T.reason_visit || 'MOTIVO DE VISITA'}</p>
                        <p className="text-xs font-black text-on-surface uppercase tracking-tight">{selectedApp.services?.name}</p>
                      </div>
                      <div className="p-5 rounded-3xl bg-on-surface/[0.02] border border-on-surface/5">
                        <p className="text-[8px] font-black text-on-surface/20 uppercase tracking-[0.2em] mb-2">{T.history_status || 'ESTADO HISTORIAL'}</p>
                        <div className="flex items-center gap-2">
                           <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                           <p className="text-[10px] font-black text-on-surface uppercase tracking-widest">{T.verified || 'VERIFICADO'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <p className="text-[8px] font-black text-on-surface/20 uppercase tracking-[0.3em]">{T.medical_record}</p>
                        <button 
                          onClick={() => setIsEditingAlerts(!isEditingAlerts)}
                          className="text-[8px] font-black text-primary hover:opacity-70 uppercase tracking-widest"
                        >
                          {isEditingAlerts ? T.done : T.edit}
                        </button>
                      </div>
                      
                      <div className={`p-6 rounded-[2rem] transition-all border-2 ${isEditingAlerts ? 'bg-amber-50 border-amber-200' : 'bg-error/5 border-error/10'}`}>
                        {isEditingAlerts ? (
                          <textarea
                            autoFocus
                            value={medicalAlerts[selectedApp.clients?.id || ''] || "No known allergies. Penicillin safe."}
                            onChange={(e) => setMedicalAlerts({
                              ...medicalAlerts,
                              [selectedApp.clients?.id || '']: e.target.value
                            })}
                            className="w-full bg-transparent text-sm font-bold text-amber-900 focus:outline-none min-h-[80px] resize-none"
                          />
                        ) : (
                           <div className="flex gap-4">
                              <Activity className="h-5 w-5 text-error flex-shrink-0" />
                              <p className="text-sm font-bold text-on-surface leading-snug">
                                {medicalAlerts[selectedApp.clients?.id || ''] || "No known allergies. Penicillin safe."}
                              </p>
                           </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="space-y-4 pt-4">
                      <button 
                        onClick={() => onSelectAppointment(selectedApp)}
                        className="w-full bg-on-surface text-white py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-on-surface/90 transition-all shadow-xl shadow-on-surface/10"
                      >
                        {T.open_medical_record || 'ABRIR EXPEDIENTE MÉDICO'}
                      </button>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => onStatusUpdate(selectedApp.id, selectedApp.status === 'attended' ? 'confirmed' : 'attended')}
                          className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border-2 ${
                            selectedApp.status === 'attended' 
                              ? 'bg-emerald-500 text-white border-emerald-500' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                          }`}
                        >
                          {selectedApp.status === 'attended' ? T.undo : T.mark_attended}
                        </button>
                        <button 
                          onClick={() => onReschedule(selectedApp)}
                          className="bg-orange-50 text-orange-600 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-orange-100 transition-all border-2 border-orange-100"
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

// Helper to check if same day
function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}
