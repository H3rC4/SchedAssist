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
    <div className="lg:col-span-8 bg-white/70 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] border border-white p-6 md:p-10 shadow-lg min-h-[400px] md:min-h-[600px]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
        <div>
          <p className="text-[10px] md:text-xs font-black text-primary-600 uppercase tracking-[0.3em] mb-1 md:mb-2">{T.dailyView}</p>
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight capitalize">
            {format(selectedDate, "EEEE d 'di' MMMM", { locale })}
          </h2>
        </div>
        <div className="bg-gray-900 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black tracking-widest uppercase shadow-lg self-start md:self-auto">
          {appointments.length} {T.appointments}
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="h-32 w-32 rounded-[2.5rem] bg-gray-50 flex items-center justify-center mb-8 border border-gray-100/50">
            <Calendar className="h-12 w-12 text-gray-200" />
          </div>
          <p className="text-xl font-bold text-gray-400">{T.noActivity}</p>
          <button onClick={onNewAppointment} className="mt-6 text-sm font-black text-primary-600 hover:tracking-[0.1em] transition-all duration-300 uppercase underline-offset-4 underline">
            {T.createFirst}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appointments.map(app => (
            <button key={app.id} onClick={() => onSelectAppointment(app)}
              className="flex flex-col p-8 rounded-[2rem] border border-gray-100 bg-white/50 hover:bg-white hover:border-primary-100 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-500 text-left group relative backdrop-blur-md">
              <div className={`absolute left-0 top-10 bottom-10 w-2 rounded-r-3xl ${
                app.status === 'needs_rescheduling' ? 'bg-red-500 animate-pulse' :
                app.status === 'confirmed' ? 'bg-emerald-500' : 
                app.status === 'awaiting_confirmation' ? 'bg-orange-500 animate-pulse' : 
                'bg-amber-400'
              }`} />
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center text-white text-xs font-black">{format(parseISO(app.start_at.slice(0, 19)), 'HH:mm')}</div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{format(parseISO(app.end_at.slice(0, 19)), 'HH:mm')}hs</span>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${
                  app.status === 'needs_rescheduling' ? 'bg-red-100 text-red-600 animate-pulse' :
                  app.status === 'awaiting_confirmation' ? 'bg-orange-100 text-orange-600' : 
                  'bg-emerald-100 text-emerald-600'
                }`}>
                  {app.status === 'needs_rescheduling' 
                    ? (lang === 'es' ? '⚠️ Reprogramar' : lang === 'it' ? '⚠️ Riprogrammare' : '⚠️ Reschedule') 
                    : app.status === 'awaiting_confirmation' ? T.reminder : T.confirmed}
                </span>
              </div>
              <p className="text-xl font-black text-gray-900 truncate mb-1 group-hover:text-primary-600 transition-colors">{app.clients?.first_name} {app.clients?.last_name}</p>
              <p className="text-xs font-bold text-gray-400 truncate uppercase tracking-widest flex items-center gap-2">
                <Stethoscope className="h-3 w-3" /> {app.services?.name}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
