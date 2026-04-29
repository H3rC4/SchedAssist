"use client"

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, parseISO } from 'date-fns'
import { Appointment } from '@/hooks/useAppointments'
import { motion } from 'framer-motion'

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
    <div className="h-fit">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-3xl font-black text-on-surface capitalize tracking-tighter">
          {format(currentMonth, 'MMMM', { locale })} <span className="text-on-surface/20 font-medium italic">{format(currentMonth, 'yyyy')}</span>
        </h2>
        <div className="flex items-center gap-2">
           <button onClick={() => onNavigate('prev')} className="p-3 rounded-2xl bg-on-surface/5 hover:bg-on-surface/10 transition-all">
             <ChevronLeft className="h-5 w-5 text-on-surface" />
           </button>
           <button onClick={() => onNavigate('next')} className="p-3 rounded-2xl bg-on-surface/5 hover:bg-on-surface/10 transition-all">
             <ChevronRight className="h-5 w-5 text-on-surface" />
           </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-6">
        {dayNames.map(d => (
           <div key={d} className="text-center text-[10px] font-black text-on-surface/20 uppercase tracking-[0.2em]">
              {d.slice(0, 1)}
           </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
        {days.map(day => {
          const selected = isSameDay(day, selectedDate)
          const today = isToday(day)
          const sameMonth = isSameMonth(day, currentMonth)
          const hasApp = appointments.some(a => isSameDay(parseISO(a.start_at.slice(0, 19)), day))
          
          return (
            <motion.button 
              key={day.toISOString()} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectDate(day)}
              className={`relative aspect-square w-full flex flex-col items-center justify-center rounded-2xl text-sm font-black transition-all duration-300
                ${selected ? 'bg-primary text-white shadow-spatial z-10' : today ? 'bg-primary/5 text-primary' : 'text-on-surface/40 hover:bg-on-surface/5 hover:text-on-surface'}
                ${!sameMonth ? 'opacity-5 pointer-events-none' : ''}`}
            >
              {format(day, 'd')}
              {hasApp && !selected && (
                <div className="absolute bottom-2 h-1.5 w-1.5 rounded-full bg-primary/20" />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
