"use client"

import { useState, Suspense } from 'react'
import { format, parseISO } from 'date-fns'
import { es, enUS, it } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Calendar as CalendarIcon, List, LayoutGrid, Clock, ShieldCheck, Activity, Target, ArrowRight } from 'lucide-react'

import { useAppointments, Appointment } from '@/hooks/useAppointments'
import { MiniCalendar } from '@/components/appointments/MiniCalendar'
import { DayActivityFeed } from '@/components/appointments/DayActivityFeed'
import { WeeklyCalendar } from '@/components/appointments/WeeklyCalendar'
import { QuickAppointmentDrawer } from '@/components/appointments/QuickAppointmentDrawer'
import { AppointmentDetailDrawer } from '@/components/appointments/AppointmentDetailDrawer'
import { getTranslations, dateLocales } from '@/lib/i18n'
import { useLandingTranslation } from '@/components/LanguageContext'

function Toast({ message, type, onClose }: { message: string; type: 'error' | 'success'; onClose: () => void }) {
  const [visible, setVisible] = useState(true)
  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`fixed bottom-12 right-12 z-[200] px-10 py-6 rounded-3xl shadow-spatial flex items-center gap-4 ${
            type === 'success' ? 'bg-primary text-white' : 'bg-error text-white'
          }`}
        >
          <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function AppointmentsContent() {
  const { language: lang, fullT: t } = useLandingTranslation()
  const {
    appointments,
    allMonthApps,
    selectedDate,
    currentMonth,
    tenantId,
    services,
    professionals,
    availableSlots,
    slotLoading,
    loading,
    setSelectedDate,
    navigateMonth,
    fetchSlots,
    pendingCalls,
    notifyingId,
    markAsNotified,
    refresh
  } = useAppointments()

  const [showNewModal, setShowNewModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily')
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [callNotes, setCallNotes] = useState<{[key: string]: string}>({})

  const T = t // Use global translation
  const locales = { es, en: enUS, it }
  const currentLocale = locales[lang as keyof typeof locales] || enUS
  const dayNames = lang === 'it'
    ? ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
    : (lang === 'es' ? ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])

  if (loading && !tenantId) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <Clock className="h-10 w-10 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* COMPACT HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 md:p-4 border-b border-on-surface/5 bg-white z-20">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 bg-primary rounded-full" />
            <span className="text-[8px] font-black tracking-[0.3em] text-on-surface/30 uppercase">
              {T.operational_intelligence || 'OPERATIONS'}
            </span>
          </div>
          <h1 className="text-lg md:text-xl font-black text-on-surface tracking-tighter uppercase leading-tight">
            {T.nav_appointments} <span className="text-primary italic font-serif lowercase">{T.calendar || 'calendar'}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-on-surface/5 rounded-xl">
            <button 
              onClick={() => setViewMode('daily')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all
                ${viewMode === 'daily' ? 'bg-white shadow-sm text-primary' : 'text-on-surface/40 hover:text-on-surface'}`}
            >
              <List className="h-3 w-3" />
              {T.daily_view}
            </button>
            <button 
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all
                ${viewMode === 'weekly' ? 'bg-white shadow-sm text-primary' : 'text-on-surface/40 hover:text-on-surface'}`}
            >
              <LayoutGrid className="h-3 w-3" />
              {T.weekly_view}
            </button>
          </div>

          <button 
            onClick={() => setShowNewModal(true)}
            className="precision-button-primary h-10 w-10 rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center p-0"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Sidebar: Mini Calendar & Operational Stats */}
        <div className="w-full lg:w-64 p-5 border-r border-on-surface/5 space-y-6 bg-on-surface/[0.02] overflow-y-auto hidden md:block custom-scrollbar">
          <div>
            <MiniCalendar 
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onNavigate={navigateMonth}
              appointments={allMonthApps}
              locale={dateLocales[lang]}
              dayNames={dayNames}
            />
          </div>

          {/* Operational Pulse */}
          <div className="space-y-4 pt-8 border-t border-on-surface/10">
            <h4 className="text-[8px] font-black text-on-surface/30 uppercase tracking-[0.3em] mb-2">{T.operational_intelligence || 'Operational Pulse'}</h4>
            <div className="p-5 rounded-2xl bg-white border border-on-surface/5 shadow-sm space-y-3">
               <p className="text-[8px] font-black text-on-surface/20 uppercase tracking-[0.2em]">{T.today}</p>
               <div className="flex items-end justify-between">
                  <span className="text-2xl font-black text-on-surface leading-none">{appointments.length}</span>
                  <span className="text-[8px] font-black text-primary uppercase tracking-widest mb-0.5">{T.appointments || 'Events'}</span>
               </div>
               <div className="h-1 w-full bg-on-surface/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (appointments.length / 20) * 100)}%` }}
                    className="h-full bg-primary" 
                  />
               </div>
            </div>
          </div>
        </div>

        {/* Dynamic Feed / Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-on-surface/[0.01] custom-scrollbar">
          {/* Pending Notifications Alert */}
          <AnimatePresence>
            {pendingCalls.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 overflow-hidden"
              >
                <div className="bg-error/5 border border-error/10 p-6 md:p-8 rounded-3xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4">
                     <Activity className="h-12 w-12 text-error/5 rotate-12" />
                   </div>
                   
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div>
                         <div className="flex items-center gap-3 mb-2">
                            <Activity className="h-4 w-4 text-error animate-pulse" />
                            <h3 className="text-sm font-black text-on-surface tracking-tighter uppercase">{T.sync_required || 'Synchronization Required'}</h3>
                         </div>
                         <p className="text-[9px] font-bold text-on-surface/40 uppercase tracking-widest max-w-lg leading-relaxed">
                           {lang === 'es' ? `Sistema detectó ${pendingCalls.length} cancelaciones pendientes.` : `System detected ${pendingCalls.length} pending cancellations.`}
                         </p>
                      </div>
                      
                      <div className="flex -space-x-3">
                        {pendingCalls.slice(0, 3).map((call, i) => (
                          <div key={call.id} className="h-9 w-9 rounded-full bg-white border border-error/20 flex items-center justify-center font-black text-error text-[10px] shadow-sm">
                            {call.clients?.first_name[0]}
                          </div>
                        ))}
                        {pendingCalls.length > 3 && (
                          <div className="h-9 w-9 rounded-full bg-error text-white border border-white flex items-center justify-center font-black text-[8px] shadow-sm">
                            +{pendingCalls.length - 3}
                          </div>
                        )}
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                      {pendingCalls.map(call => (
                        <div key={call.id} className="bg-white p-5 rounded-2xl border border-error/10 hover:shadow-md transition-all group">
                           <div className="flex items-center gap-4 mb-4">
                              <div className="h-10 w-10 rounded-xl bg-error/5 flex items-center justify-center text-error font-black text-xs">
                                 {call.clients?.first_name[0]}
                              </div>
                              <div>
                                 <p className="text-sm font-black text-on-surface leading-none mb-1">{call.clients?.first_name} {call.clients?.last_name}</p>
                                 <p className="text-[9px] font-bold text-on-surface/30 uppercase tracking-widest">{call.clients?.phone}</p>
                              </div>
                           </div>
                           <div className="flex items-center justify-between gap-3">
                              <span className="text-[9px] font-black text-on-surface/20 uppercase tracking-widest">
                                 {format(parseISO(call.start_at), "MMM dd, HH:mm")}
                              </span>
                              <button 
                                 onClick={() => markAsNotified(call.id, callNotes[call.id])}
                                 disabled={notifyingId === call.id}
                                 className="h-9 px-4 rounded-xl bg-error text-white text-[8px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2"
                              >
                                 {notifyingId === call.id ? <Clock className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                                 {T.clear || 'Clear'}
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {viewMode === 'daily' ? (
              <motion.div
                key="daily"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <DayActivityFeed 
                  selectedDate={selectedDate}
                  appointments={appointments}
                  translations={T}
                  locale={currentLocale}
                  onSelectAppointment={setSelectedAppointment}
                  onNewAppointment={() => setShowNewModal(true)}
                  lang={lang}
                />
              </motion.div>
            ) : (
              <motion.div
                key="weekly"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <WeeklyCalendar 
                  selectedDate={selectedDate}
                  appointments={appointments}
                  lang={lang}
                  translations={T}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Drawers */}
      <AnimatePresence>
        {showNewModal && (
          <QuickAppointmentDrawer
            tenantId={tenantId}
            lang={lang}
            services={services}
            professionals={professionals}
            onClose={() => setShowNewModal(false)}
            onSuccess={() => { refresh(); setShowNewModal(false); setToast({ message: T.success || 'Appointment Created', type: 'success' }) }}
            selectedDate={selectedDate}
            translations={T}
            availableSlots={availableSlots}
            slotLoading={slotLoading}
            onFetchSlots={fetchSlots}
          />
        )}

        {selectedAppointment && (
          <AppointmentDetailDrawer
            appointment={selectedAppointment}
            lang={lang}
            onClose={() => setSelectedAppointment(null)}
            onSuccess={() => { refresh(); setSelectedAppointment(null); setToast({ message: T.success || 'Updated', type: 'success' }) }}
            tenantId={tenantId}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center bg-surface">
        <Clock className="h-12 w-12 text-primary animate-spin" />
      </div>
    }>
      <AppointmentsContent />
    </Suspense>
  )
}
