"use client"

import { useState, Suspense } from 'react'
import { format, parseISO } from 'date-fns'
import { es, enUS, it } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Calendar as CalendarIcon, List, LayoutGrid, Clock, ShieldCheck, Activity, Target, ArrowRight, X } from 'lucide-react'

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
    refresh,
    updateStatus,
    cancelAppointment
  } = useAppointments()

  const [showNewModal, setShowNewModal] = useState(false)
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [rescheduledFromId, setRescheduledFromId] = useState<string | null>(null)
  const [reschedulePatient, setReschedulePatient] = useState<{first_name: string, last_name: string, phone: string} | undefined>(undefined)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily')
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [callNotes, setCallNotes] = useState<{[key: string]: string}>({})

  const handleStatusUpdate = async (id: string, status: string) => {
    await updateStatus(id, status)
  }

  const handleReschedule = async (app: Appointment) => {
    const success = await cancelAppointment(app.id)
    if (success) {
      setReschedulePatient({
        first_name: app.clients?.first_name || '',
        last_name: app.clients?.last_name || '',
        phone: app.clients?.phone || ''
      })
      setShowNewModal(true)
      setToast({ message: T.rescheduleSuccess, type: 'success' })
      setTimeout(() => setToast(null), 3000)
    }
  }

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
            <span className="text-[8px] font-black tracking-[0.3em] text-on-surface/40 uppercase">
              {T.operational_intelligence}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-on-surface tracking-tighter uppercase leading-tight">
            {T.nav_appointments} <span className="text-primary italic font-serif lowercase ml-1">{T.calendar}</span>
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
        {/* Sidebar: Mini Calendar & Operational Stats - ONLY IN WEEKLY VIEW */}
        {viewMode === 'weekly' && (
          <div className="w-full lg:w-[260px] p-6 border-r border-on-surface/5 space-y-8 bg-on-surface/[0.02] overflow-y-auto hidden md:block custom-scrollbar flex-shrink-0">
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
              <h4 className="text-[8px] font-black text-on-surface/30 uppercase tracking-[0.3em] mb-2">{T.operational_intelligence}</h4>
              <div className="p-5 rounded-2xl bg-white border border-on-surface/5 shadow-sm space-y-3">
                 <p className="text-[8px] font-black text-on-surface/20 uppercase tracking-[0.2em]">{T.today}</p>
                 <div className="flex items-end justify-between">
                    <span className="text-2xl font-black text-on-surface leading-none">{appointments.length}</span>
                    <span className="text-[8px] font-black text-primary uppercase tracking-widest mb-0.5">{T.appointments}</span>
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
        )}

        {/* Dynamic Feed / Grid */}
        <div className={`flex-1 overflow-y-auto bg-on-surface/[0.01] custom-scrollbar ${viewMode === 'daily' ? 'p-4 md:p-6' : 'p-0'}`}>
          {/* Pending Notifications Alert - Redesigned as a compact banner */}
          <AnimatePresence>
            {pendingCalls.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-10 px-2"
              >
                <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-[2rem] relative overflow-hidden group">
                   <div className="flex items-center justify-between gap-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                           <Activity className="h-5 w-5 animate-pulse" />
                        </div>
                        <div>
                           <h3 className="text-[10px] font-black text-amber-700 tracking-[0.2em] uppercase">{T.sync_required || 'SINCRONIZACIÓN REQUERIDA'}</h3>
                           <p className="text-[9px] font-bold text-amber-700/40 uppercase tracking-widest mt-0.5">
                             {T.pending_cancellations_desc(pendingCalls.length)}
                           </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2 mr-4">
                          {pendingCalls.slice(0, 5).map((call) => (
                            <div key={call.id} className="h-8 w-8 rounded-full bg-white border border-amber-500/20 flex items-center justify-center font-black text-amber-700 text-[10px] shadow-sm ring-2 ring-transparent group-hover:ring-amber-500/10 transition-all">
                              {call.clients?.first_name[0]}
                            </div>
                          ))}
                          {pendingCalls.length > 5 && (
                            <div className="h-8 w-8 rounded-full bg-amber-500 text-white border border-white flex items-center justify-center font-black text-[8px] shadow-sm">
                              +{pendingCalls.length - 5}
                            </div>
                          )}
                        </div>
                        <button 
                           onClick={() => setShowPendingModal(true)}
                           className="h-10 px-6 rounded-xl bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-amber-500/20"
                        >
                           {T.view_all || 'REVISAR'}
                        </button>
                      </div>
                   </div>

                   {/* Background Glow */}
                   <div className="absolute -right-20 -top-20 h-64 w-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />
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
                  selectedDate={new Date()}
                  appointments={appointments}
                  translations={T}
                  locale={currentLocale}
                  onSelectAppointment={setSelectedAppointment}
                  onNewAppointment={() => setShowNewModal(true)}
                  onStatusUpdate={handleStatusUpdate}
                  onReschedule={handleReschedule}
                  onDeleteAppointment={cancelAppointment}
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
                  appointments={allMonthApps}
                  lang={lang}
                  translations={T}
                  onNavigateDate={setSelectedDate}
                  dateLocales={dateLocales}
                  onSelectAppointment={setSelectedAppointment}
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
            onClose={() => {
              setShowNewModal(false)
              setReschedulePatient(undefined)
            }}
            onSuccess={() => { 
              refresh(); 
              setShowNewModal(false); 
              setReschedulePatient(undefined);
              setRescheduledFromId(null);
              setToast({ message: T.success, type: 'success' }) 
            }}
            selectedDate={selectedDate}
            translations={T}
            availableSlots={availableSlots}
            slotLoading={slotLoading}
            onFetchSlots={fetchSlots}
            initialPatient={reschedulePatient}
            rescheduledFromId={rescheduledFromId}
          />
        )}

        {selectedAppointment && (
          <AppointmentDetailDrawer
            appointment={selectedAppointment}
            lang={lang}
            onClose={() => setSelectedAppointment(null)}
            onSuccess={() => { refresh(); setSelectedAppointment(null); setToast({ message: T.success || 'Updated', type: 'success' }) }}
            tenantId={tenantId}
            translations={T}
            onReschedule={(app) => {
              setReschedulePatient({
                first_name: app.clients?.first_name || '',
                last_name: app.clients?.last_name || '',
                phone: app.clients?.phone || ''
              })
              setRescheduledFromId(app.id)
              setShowNewModal(true)
              setSelectedAppointment(null)
            }}
            onUpdateStatus={updateStatus}
            onMarkAsNotified={markAsNotified}
          />
        )}

        {showPendingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowPendingModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-surface border border-border/50 rounded-[2rem] shadow-spatial overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-border/50 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[11px] font-black text-foreground tracking-[0.2em] uppercase">{T.sync_required || 'SINCRONIZACIÓN REQUERIDA'}</h2>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                      {T.pending_cancellations_desc(pendingCalls.length)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPendingModal(false)}
                  className="h-10 w-10 rounded-full bg-surface-hover flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-3">
                {pendingCalls.map(app => (
                  <div key={app.id} className="p-4 rounded-2xl border border-border/50 bg-surface-hover/50 hover:bg-surface-hover transition-colors group cursor-pointer" 
                    onClick={() => { 
                      setSelectedAppointment(app); 
                      setShowPendingModal(false); 
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black text-foreground tracking-widest uppercase">{app.clients?.first_name} {app.clients?.last_name}</span>
                      <span className="text-[9px] font-bold text-amber-500 tracking-widest uppercase bg-amber-500/10 px-2 py-1 rounded-md">{T.pending_cancellation || 'Pte. Cancelación'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-medium text-muted-foreground">
                      <span className="flex items-center gap-1.5"><CalendarIcon className="h-3 w-3" /> {format(parseISO(app.start_at), "d MMM", { locale: currentLocale })}</span>
                      <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {format(parseISO(app.start_at), "HH:mm")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
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
