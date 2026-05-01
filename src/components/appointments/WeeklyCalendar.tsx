"use client"

import { useMemo, useState } from 'react'
import { format, startOfWeek, addDays, isSameDay, parseISO, subDays } from 'date-fns'
import { motion } from 'framer-motion'
import { Clock, User, ChevronLeft, ChevronRight } from 'lucide-react'

interface WeeklyCalendarProps {
  selectedDate: Date;
  appointments: any[];
  lang: 'en' | 'es' | 'it';
  translations: any;
  onNavigateDate: (date: Date) => void;
  dateLocales: any;
  onSelectAppointment: (apt: any) => void;
}

export function WeeklyCalendar({ selectedDate, appointments, lang, translations: T, onNavigateDate, dateLocales, onSelectAppointment }: WeeklyCalendarProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null)
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null)

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [selectedDate])

  const hours = Array.from({ length: 14 }, (_, i) => i + 8) // 8:00 to 21:00

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Week Header */}
      <div className="flex border-b border-on-surface/5 bg-surface/50">
        <div className="w-[100px] flex items-center justify-center border-r border-on-surface/5 flex-shrink-0">
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
          <motion.div 
            key={idx} 
            animate={{ flex: expandedDay === idx ? 2 : expandedDay !== null ? 0.5 : 1 }}
            className={`text-center py-6 border-r border-on-surface/5 last:border-0 cursor-pointer transition-colors ${isSameDay(day, new Date()) ? 'bg-primary/[0.03]' : ''} ${expandedDay === idx ? 'bg-primary/[0.05]' : ''}`}
            onClick={() => {
              setExpandedDay(expandedDay === idx ? null : idx)
              if (expandedDay === idx) setExpandedSlot(null)
            }}
          >
            <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] mb-1">
              {format(day, 'EEE', { locale: dateLocales[lang] })}
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
          </motion.div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="flex divide-x divide-on-surface/5 min-h-full">
          {/* Time Column */}
          <div className="w-[100px] bg-on-surface/2 flex-shrink-0">
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
            <motion.div 
              key={dayIdx} 
              animate={{ flex: expandedDay === dayIdx ? 2 : expandedDay !== null ? 0.5 : 1 }}
              className="relative h-full transition-all overflow-hidden cursor-default"
              onClick={() => {
                if (expandedDay === dayIdx && expandedSlot) {
                  setExpandedSlot(null)
                }
              }}
            >
              {hours.map(hour => (
                <div key={hour} className="h-24 border-b border-on-surface/5 last:border-0" />
              ))}

              {/* Appointments for this day */}
              {(() => {
                const dayAppointments = appointments.filter(apt => isSameDay(parseISO(apt.start_at), day));
                
                const groupedApts = dayAppointments.reduce((acc: any, apt) => {
                  const timeKey = format(parseISO(apt.start_at), 'HH:mm');
                  if (!acc[timeKey]) acc[timeKey] = [];
                  acc[timeKey].push(apt);
                  return acc;
                }, {});

                return Object.entries(groupedApts).map(([timeKey, group]: [string, any]) => {
                  const startDate = parseISO(group[0].start_at)
                  const startHour = startDate.getHours()
                  const startMin = startDate.getMinutes()
                  const duration = 30 // Assuming 30m for visualization if not present
                  
                  const top = ((startHour - 8) * 96) + (startMin / 60 * 96)
                  const height = (duration / 60) * 96
                  const isExpandedDay = expandedDay === dayIdx
                  const isExpandedSlot = expandedSlot === `${dayIdx}-${timeKey}` && isExpandedDay

                  if (group.length > 1 && !isExpandedSlot) {
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ 
                          opacity: expandedDay !== null && !isExpandedDay ? 0.3 : 1,
                          scale: 1,
                          x: 0
                        }}
                        key={`group-${dayIdx}-${timeKey}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedSlot(`${dayIdx}-${timeKey}`)
                          setExpandedDay(dayIdx)
                        }}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        className={`absolute left-1 w-[85%] lg:w-[75%] rounded-xl p-2 bg-primary/20 border-l-4 border-primary shadow-sm flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-all z-10`}
                      >
                        <span className="text-[10px] font-black text-primary uppercase tracking-wider text-center leading-tight">
                          {group.length}<br/>{lang === 'es' ? 'Citas' : lang === 'it' ? 'Appuntamenti' : 'Appointments'}
                        </span>
                      </motion.div>
                    )
                  }

                  return group.map((apt: any, index: number) => {
                    const count = group.length;
                    const isGrouped = count > 1 && isExpandedSlot;
                    const widthStyle = isGrouped ? `calc(${100 / count}% - 6px)` : undefined;
                    const leftStyle = isGrouped ? `calc(${index * (100 / count)}% + 3px)` : undefined;
                    const responsiveClasses = isGrouped ? '' : 'left-1 w-[85%] lg:w-[75%]';

                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ 
                          opacity: expandedDay !== null && !isExpandedDay ? 0.3 : 1,
                          scale: 1,
                          x: 0
                        }}
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectAppointment(apt)
                        }}
                        style={{ 
                          top: `${top}px`, 
                          height: `${height}px`, 
                          ...(isGrouped ? { width: widthStyle, left: leftStyle } : {})
                        }}
                        className={`absolute ${responsiveClasses} rounded-xl p-2 bg-primary/10 border-l-4 border-primary shadow-sm overflow-hidden group cursor-pointer hover:bg-primary hover:border-primary-700 transition-all z-10 ${isExpandedDay ? 'p-3' : 'p-1'}`}
                      >
                        <div className="flex flex-col h-full justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                               <p className={`font-black text-primary group-hover:text-white uppercase truncate tracking-tighter ${isExpandedDay ? 'text-[9px]' : 'text-[7px]'}`}>
                                 {apt.clients?.first_name} {apt.clients?.last_name}
                               </p>
                               <span className={`font-black group-hover:text-white text-primary/40 ${isExpandedDay ? 'text-[8px]' : 'text-[6px]'}`}>
                                 {format(startDate, 'HH:mm')}
                               </span>
                            </div>
                            
                            <p className="text-[6px] lg:text-[7px] font-bold text-on-surface/40 group-hover:text-white/60 uppercase truncate leading-none">
                              {apt.services?.name}
                            </p>
                            
                            {isExpandedDay && (
                              <p className="text-[7px] font-black text-primary/60 group-hover:text-white/80 uppercase truncate mt-1">
                                 Dr. {apt.professionals?.full_name?.split(' ').pop()}
                              </p>
                            )}
                          </div>
                          
                          {!isExpandedDay && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                               <User className="h-1.5 w-1.5 text-white/50" />
                               <span className="text-[5px] font-black text-white/70 uppercase">
                                 {apt.professionals?.full_name?.split(' ').pop()}
                               </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })
                })
              })()}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
