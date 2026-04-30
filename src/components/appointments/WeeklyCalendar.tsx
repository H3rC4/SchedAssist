"use client"

import { useMemo } from 'react'
import { format, startOfWeek, addDays, isSameDay, parseISO, subDays } from 'date-fns'
import { motion } from 'framer-motion'
import { Clock, User, ChevronLeft, ChevronRight } from 'lucide-react'

interface WeeklyCalendarProps {
  selectedDate: Date;
  appointments: any[];
  lang: 'en' | 'es' | 'it';
  translations: any;
  onNavigateDate: (date: Date) => void;
}

export function WeeklyCalendar({ selectedDate, appointments, lang, translations: T, onNavigateDate }: WeeklyCalendarProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [selectedDate])

  const hours = Array.from({ length: 14 }, (_, i) => i + 8) // 8:00 to 21:00

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Week Header */}
      <div className="grid grid-cols-8 border-b border-on-surface/5 bg-surface/50">
        <div className="col-span-1 flex items-center justify-center border-r border-on-surface/5">
           <div className="flex items-center gap-1">
              <button 
                onClick={() => onNavigateDate(subDays(selectedDate, 7))}
                className="p-2 hover:bg-on-surface/5 rounded-full transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-on-surface/40" />
              </button>
              <button 
                onClick={() => onNavigateDate(addDays(selectedDate, 7))}
                className="p-2 hover:bg-on-surface/5 rounded-full transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-on-surface/40" />
              </button>
           </div>
        </div>
        {weekDays.map((day, idx) => (
          <div key={idx} className={`text-center py-6 border-r border-on-surface/5 last:border-0 ${isSameDay(day, new Date()) ? 'bg-primary/[0.03]' : ''}`}>
            <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] mb-1">
              {format(day, 'EEE')}
            </p>
            <div className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-black transition-all ${
              isSameDay(day, new Date()) 
                ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                : isSameDay(day, selectedDate)
                ? 'bg-on-surface/10 text-on-surface'
                : 'text-on-surface'
            }`}>
              {format(day, 'dd')}
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="grid grid-cols-8 divide-x divide-on-surface/5 min-h-full">
          {/* Time Column */}
          <div className="col-span-1 bg-on-surface/2">
            {hours.map(hour => (
              <div key={hour} className="h-24 px-4 py-2 border-b border-on-surface/5 last:border-0 flex justify-end">
                <span className="text-[10px] font-black text-on-surface/20 uppercase">
                  {hour}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map((day, dayIdx) => (
            <div key={dayIdx} className="col-span-1 relative h-full">
              {hours.map(hour => (
                <div key={hour} className="h-24 border-b border-on-surface/5 last:border-0" />
              ))}

              {/* Appointments for this day */}
              {appointments
                .filter(apt => isSameDay(parseISO(apt.start_at), day))
                .map((apt, aptIdx) => {
                  const startDate = parseISO(apt.start_at)
                  const startHour = startDate.getHours()
                  const startMin = startDate.getMinutes()
                  const duration = 30 // Assuming 30m for visualization if not present
                  
                  const top = ((startHour - 8) * 96) + (startMin / 60 * 96)
                  const height = (duration / 60) * 96

                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={apt.id}
                      style={{ top: `${top}px`, height: `${height}px` }}
                      className="absolute left-1 right-1 rounded-xl p-2 bg-primary/10 border-l-4 border-primary shadow-sm overflow-hidden group cursor-pointer hover:bg-primary hover:border-primary-700 transition-all z-10"
                    >
                      <div className="flex flex-col h-full justify-between">
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-primary group-hover:text-white uppercase truncate tracking-tighter">
                            {apt.clients?.first_name} {apt.clients?.last_name}
                          </p>
                          <p className="text-[8px] font-bold text-on-surface/60 group-hover:text-white/80 uppercase truncate">
                            {apt.services?.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Clock className="h-2 w-2 text-white" />
                          <span className="text-[7px] font-black text-white">{format(startDate, 'HH:mm')}</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
