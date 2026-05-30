"use client"
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfToday, addMonths } from 'date-fns'
import { hexToRgba } from '@/lib/utils'
import { motion } from 'framer-motion'

interface DateGridProps {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  primaryColor: string
  secondaryColor: string
  locale: any
  dayNames: string[]
  maxDate?: Date
}

export function DateGrid({
  selectedDate,
  onSelectDate,
  primaryColor,
  secondaryColor,
  locale,
  dayNames,
  maxDate
}: DateGridProps) {
  const today = startOfToday()
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today))
  
  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startDayOfWeek = startOfMonth(currentMonth).getDay()
  const endLimit = maxDate || addMonths(today, 2)

  const canGoPrev = !isBefore(startOfMonth(currentMonth), startOfMonth(today))
  const canGoNext = !isBefore(endOfMonth(currentMonth), endLimit)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-[#191c1e] capitalize tracking-tighter">
          {format(currentMonth, 'MMMM yyyy', { locale })}
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentMonth(prev => addMonths(prev, -1))}
            disabled={!canGoPrev}
            className="p-2 rounded-xl bg-surface hover:bg-white transition-all disabled:opacity-20 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4 text-[#191c1e]" />
          </button>
          <button 
            onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
            disabled={!canGoNext}
            className="p-2 rounded-xl bg-surface hover:bg-white transition-all disabled:opacity-20 disabled:pointer-events-none"
          >
            <ChevronRight className="h-4 w-4 text-[#191c1e]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(d => (
          <div key={d} className="text-center text-[9px] font-black text-[#191c1e]/30 uppercase tracking-wider py-2">
            {d.slice(0, 2)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`e-${i}`} className="aspect-square" />
        ))}
        {days.map(day => {
          const selected = isSameDay(day, selectedDate)
          const todayFlag = isToday(day)
          const isPast = isBefore(day, today)
          const isFuture = !isBefore(day, today) && !isBefore(endLimit, day)

          return (
            <motion.button
              key={day.toISOString()}
              whileHover={{ scale: isPast || isFuture ? 1 : 1.05 }}
              whileTap={{ scale: isPast || isFuture ? 1 : 0.95 }}
              onClick={() => !isPast && !isFuture && onSelectDate(day)}
              disabled={isPast || isFuture}
              className={`
                aspect-square flex items-center justify-center rounded-xl text-sm font-black transition-all
                ${selected 
                  ? 'text-white shadow-lg' 
                  : todayFlag 
                    ? 'text-white' 
                    : isPast || isFuture
                      ? 'text-[#191c1e]/10 cursor-not-allowed'
                      : 'text-[#191c1e] hover:bg-white'
                }
              `}
              style={selected 
                ? { backgroundColor: secondaryColor } 
                : todayFlag 
                  ? { backgroundColor: hexToRgba(secondaryColor, 0.15) } 
                  : undefined
              }
            >
              {format(day, 'd')}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}