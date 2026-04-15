"use client"

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, parseISO } from 'date-fns'
import { Appointment } from '@/hooks/useAppointments'

interface MiniCalendarProps {
  currentMonth: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onNavigate: (dir: 'next' | 'prev') => void;
  appointments: Appointment[];
  locale: any;
  dayNames: string[];
}

export function MiniCalendar({
  currentMonth,
  selectedDate,
  onSelectDate,
  onNavigate,
  appointments,
  locale,
  dayNames
}: MiniCalendarProps) {
  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startDayOfWeek = startOfMonth(currentMonth).getDay()

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] border border-white p-6 md:p-10 shadow-lg h-fit">
      <div className="flex items-center justify-between mb-10">
        <button onClick={() => onNavigate('prev')} className="p-4 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 transition-all shadow-sm">
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h2 className="text-2xl font-black text-gray-900 capitalize tracking-tight">
          {format(currentMonth, 'MMMM yyyy', { locale })}
        </h2>
        <button onClick={() => onNavigate('next')} className="p-4 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 transition-all shadow-sm">
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2 mb-6">
        {dayNames.map(d => <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
        {days.map(day => {
          const selected = isSameDay(day, selectedDate), today = isToday(day), sameMonth = isSameMonth(day, currentMonth)
          const hasApp = appointments.some(a => isSameDay(parseISO(a.start_at.slice(0, 19)), day))
          return (
            <button key={day.toISOString()} onClick={() => onSelectDate(day)}
              className={`relative aspect-square w-full flex flex-col items-center justify-center rounded-2xl text-sm font-black transition-all duration-300
                ${selected ? 'bg-primary-600 text-white shadow-2xl shadow-primary-200 scale-110 z-10' : today ? 'bg-primary-50 text-primary-600 ring-2 ring-primary-100' : 'text-gray-600 hover:bg-gray-50'}
                ${!sameMonth ? 'opacity-10 pointer-events-none' : ''}`}>
              {format(day, 'd')}
              {hasApp && !selected && <span className="absolute bottom-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
