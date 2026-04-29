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
    lang,
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

  const T = getTranslations(lang)
  const locales = { es, en: enUS, it }
  const currentLocale = locales[lang as keyof typeof locales] || enUS
  const dayNames = lang === 'it'
    ? ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
    : (lang === 'es' ? ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])

  if (loading && !tenantId) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <Clock className="h-12 w-12 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header / Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 border-b border-on-surface/5 bg-white z-20">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black tracking-[0.4em] text-on-surface/40 uppercase">
              Operations Center
            </span>
          </div>
          <h1 className="precision-header text-3xl">
            Management <br />
            <span className="text-primary italic font-serif">Registry</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex p-1 bg-on-surface/5 rounded-2xl">
            <button 
              onClick={() => setViewMode('daily')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                ${viewMode === 'daily' ? 'bg-white shadow-spatial text-primary' : 'text-on-surface/40 hover:text-on-surface'}`}
            >
              <List className="h-3.5 w-3.5" />
              {T.daily_view}
            </button>
            <button 
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                ${viewMode === 'weekly' ? 'bg-white shadow-spatial text-primary' : 'text-on-surface/40 hover:text-on-surface'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              {T.weekly_view}
            </button>
          </div>

          <button 
            onClick={() => setShowNewModal(true)}
            className="bg-primary text-white p-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Sidebar: Mini Calendar & Operational Stats */}
        <div className="w-full lg:w-72 p-6 border-r border-on-surface/5 space-y-8 bg-on-surface/[0.02] overflow-y-auto hidden md:block custom-scrollbar">
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
          <div className="space-y-6 pt-12 border-t border-on-surface/10">
            <h4 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.4em] mb-4">Operational Pulse</h4>
            <div className="p-8 rounded-[2.5rem] bg-white border border-on-surface/5 shadow-sm space-y-4">
               <p className="text-[10px] font-black text-on-surface/20 uppercase tracking-[0.3em]">{T.today}</p>
               <div className="flex items-end justify-between">
                  <span className="text-4xl font-black text-on-surface">{appointments.length}</span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Events</span>
               </div>
               <div className="h-1.5 w-full bg-on-surface/5 rounded-full overflow-hidden">
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
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-on-surface/[0.01] custom-scrollbar">
          {/* Pending Notifications Alert (Restored with high-fidelity style) */}
          <AnimatePresence>
            {pendingCalls.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-16 overflow-hidden"
              >
                <div className="bg-error/5 border border-error/10 p-10 md:p-12 rounded-[3.5rem] relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8">
                     <Activity className="h-20 w-20 text-error/5 rotate-12" />
                   </div>
                   
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                      <div>
                         <div className="flex items-center gap-4 mb-4">
                            <Activity className="h-5 w-5 text-error animate-pulse" />
                            <h3 className="text-xl font-black text-on-surface tracking-tighter uppercase">Synchronization Required</h3>
                         </div>
                         <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest max-w-lg">
                           System detected {pendingCalls.length} cancellations that require immediate patient confirmation.
                         </p>
                      </div>
                      
                      <div className="flex -space-x-4">
                        {pendingCalls.slice(0, 3).map((call, i) => (
                          <div key={call.id} className="h-12 w-12 rounded-full bg-white border-2 border-error/20 flex items-center justify-center font-black text-error text-xs shadow-sm">
                            {call.clients?.first_name[0]}
                          </div>
                        ))}
                        {pendingCalls.length > 3 && (
                          <div className="h-12 w-12 rounded-full bg-error text-white border-2 border-white flex items-center justify-center font-black text-[10px] shadow-sm">
                            +{pendingCalls.length - 3}
                          </div>
                        )}
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                      {pendingCalls.map(call => (
                        <div key={call.id} className="bg-white p-8 rounded-[2.5rem] border border-error/10 hover:shadow-xl hover:shadow-error/5 transition-all group">
                           <div className="flex items-center gap-5 mb-6">
                              <div className="h-12 w-12 rounded-2xl bg-error/5 flex items-center justify-center text-error font-black text-sm">
                                 {call.clients?.first_name[0]}
                              </div>
                              <div>
                                 <p className="text-base font-black text-on-surface leading-none mb-1">{call.clients?.first_name} {call.clients?.last_name}</p>
                                 <p className="text-[10px] font-bold text-on-surface/30 uppercase tracking-widest">{call.clients?.phone}</p>
                              </div>
                           </div>
                           <div className="flex items-center justify-between gap-4">
                              <span className="text-[10px] font-black text-on-surface/20 uppercase tracking-widest">
                                 {format(parseISO(call.start_at), "MMM dd, HH:mm")}
                              </span>
                              <button 
                                 onClick={() => markAsNotified(call.id, callNotes[call.id])}
                                 disabled={notifyingId === call.id}
                                 className="h-12 px-6 rounded-2xl bg-error text-white text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                              >
                                 {notifyingId === call.id ? <Clock className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                 Clear
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
