"use client"

import { Calendar, Stethoscope } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Appointment } from '@/hooks/useAppointments'

interface DayActivityFeedProps {
  selectedDate: Date;
  appointments: Appointment[];
  translations: any;
  locale: any;
  onSelectAppointment: (app: Appointment) => void;
  onNewAppointment: () => void;
  lang: string;
}

export function DayActivityFeed({
  selectedDate,
  appointments,
  translations: T,
  locale,
  onSelectAppointment,
  onNewAppointment,
  lang
}: DayActivityFeedProps) {
  return (
    <div className="lg:col-span-8 bg-primary-900/40 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] border border-white/5 p-6 md:p-10 shadow-2xl min-h-[400px] md:min-h-[600px]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
        <div>
          <p className="text-[10px] md:text-xs font-black text-accent-500 uppercase tracking-[0.3em] mb-1 md:mb-2">{T.dailyView}</p>
          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight capitalize">
            {format(selectedDate, "EEEE d 'di' MMMM", { locale })}
          </h2>
        </div>
        <div className="bg-primary-950/50 text-white border border-white/5 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black tracking-widest uppercase shadow-lg self-start md:self-auto">
          {appointments.length} {T.appointments}
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="h-32 w-32 rounded-[2.5rem] bg-primary-950/50 flex items-center justify-center mb-8 border border-white/5">
            <Calendar className="h-12 w-12 text-primary-800" />
          </div>
          <p className="text-xl font-bold text-primary-400">{T.noActivity}</p>
          <button onClick={onNewAppointment} className="mt-6 text-sm font-black text-accent-500 hover:tracking-[0.1em] transition-all duration-300 uppercase underline-offset-4 underline">
            {T.createFirst}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appointments.map(app => (
            <button key={app.id} onClick={() => onSelectAppointment(app)}
              className="flex flex-col p-8 rounded-[2rem] border border-white/5 bg-primary-800/20 hover:bg-primary-800/40 hover:border-accent-500/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left group relative backdrop-blur-md">
              <div className={`absolute left-0 top-10 bottom-10 w-2 rounded-r-3xl ${
                app.status === 'needs_rescheduling' ? 'bg-red-500 animate-pulse' :
                app.status === 'confirmed' ? 'bg-accent-500' : 
                app.status === 'awaiting_confirmation' ? 'bg-orange-500 animate-pulse' : 
                'bg-accent-400'
              }`} />
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary-950 flex items-center justify-center text-white text-xs font-black">{format(parseISO(app.start_at.slice(0, 19)), 'HH:mm')}</div>
                  <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{format(parseISO(app.end_at.slice(0, 19)), 'HH:mm')}hs</span>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${
                  app.status === 'needs_rescheduling' ? 'bg-red-500/10 text-red-400 animate-pulse' :
                  app.status === 'awaiting_confirmation' ? 'bg-orange-500/10 text-orange-400' : 
                  'bg-accent-500/10 text-accent-500'
                }`}>
                  {app.status === 'needs_rescheduling' 
                    ? (lang === 'es' ? '⚠️ Reprogramar' : lang === 'it' ? '⚠️ Riprogrammare' : '⚠️ Reschedule') 
                    : app.status === 'awaiting_confirmation' ? T.reminder : T.confirmed}
                </span>
              </div>
              <p className="text-xl font-black text-white truncate mb-1 group-hover:text-accent-500 transition-colors">{app.clients?.first_name} {app.clients?.last_name}</p>
              <p className="text-xs font-bold text-primary-500 truncate uppercase tracking-widest flex items-center gap-2">
                <Stethoscope className="h-3 w-3" /> {app.services?.name}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
