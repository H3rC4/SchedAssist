"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Shield, AlertCircle, Clock, FileText, Plus, ChevronRight, Download, History as HistoryIcon, CalendarDays, ExternalLink } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { it } from 'date-fns/locale/it'
import { enUS } from 'date-fns/locale/en-US'

interface MedicalEntry {
  id: string;
  date: string;
  content: string;
  professionals?: { full_name: string };
  attachments?: { name: string, url: string }[];
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  notes: string | null;
  created_at: string;
}

interface PatientMedicalRecordDrawerProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  history: MedicalEntry[];
  appointments: any[];
  lang: 'en' | 'es' | 'it';
  translations: any;
  onAddNote: () => void;
  onScheduleAppointment: () => void;
}

export function PatientMedicalRecordDrawer({
  patient,
  isOpen,
  onClose,
  history,
  appointments,
  lang,
  translations: t,
  onAddNote,
  onScheduleAppointment
}: PatientMedicalRecordDrawerProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'files' | 'upcoming'>('history')
  const dateLocale = lang === 'it' ? it : (lang === 'es' ? es : enUS)

  // Parse patient notes for metadata
  const metadata = (() => {
    try {
      if (!patient.notes) return { dob: '', allergies: '', insurance: '', id_number: patient.id.slice(0, 8).toUpperCase() }
      const parsed = JSON.parse(patient.notes)
      return {
        dob: parsed.dob || '',
        allergies: parsed.allergies || '',
        insurance: parsed.insurance || '',
        id_number: parsed.id_number || patient.id.slice(0, 8).toUpperCase()
      }
    } catch (e) {
      return { dob: '', allergies: '', insurance: '', id_number: patient.id.slice(0, 8).toUpperCase() }
    }
  })()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-secondary-900/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-surface-container-low flex items-center justify-between">
              <h2 className="text-2xl font-black text-secondary-900 tracking-tight">
                {t.medical_record}: <span className="text-primary-600">{patient.first_name} {patient.last_name}</span>
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-surface-container-low text-secondary-400 hover:text-secondary-900 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Metadata Bar */}
            <div className="px-8 py-4 bg-surface-container-lowest border-b border-surface-container-low flex items-center gap-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
              <div className="flex items-center gap-2 text-xs font-bold text-secondary-500">
                <Calendar className="h-4 w-4 text-primary-600" />
                <span className="uppercase tracking-widest text-[10px] opacity-60">{t.dob}:</span>
                <span className="text-secondary-900">{metadata.dob || 'N/A'}</span>
              </div>
              <div className="h-4 w-px bg-surface-container-low" />
              <div className="flex items-center gap-2 text-xs font-bold text-secondary-500">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="uppercase tracking-widest text-[10px] opacity-60">{t.allergies}:</span>
                <span className="text-secondary-900">{metadata.allergies || 'None'}</span>
              </div>
              <div className="h-4 w-px bg-surface-container-low" />
              <div className="flex items-center gap-2 text-xs font-bold text-secondary-500">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span className="uppercase tracking-widest text-[10px] opacity-60">{t.insurance}:</span>
                <span className="text-secondary-900">{metadata.insurance || 'N/A'}</span>
              </div>
            </div>

            {/* Tabs */}
            <nav className="px-8 border-b border-surface-container-low flex gap-8">
              {[
                { id: 'history', label: t.history, icon: HistoryIcon },
                { id: 'files', label: t.files, icon: FileText },
                { id: 'upcoming', label: t.upcoming_appointments, icon: CalendarDays }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                    activeTab === tab.id ? 'text-primary-600' : 'text-secondary-300 hover:text-secondary-900'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-full"
                    />
                  )}
                </button>
              ))}
            </nav>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    {history.length === 0 ? (
                      <div className="py-20 text-center space-y-4 opacity-40">
                        <HistoryIcon className="h-12 w-12 mx-auto" />
                        <p className="text-xs font-black uppercase tracking-widest">{t.no_remarks_yet}</p>
                      </div>
                    ) : (
                      <div className="relative pl-6 space-y-12 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-surface-container-low">
                        {history.map((entry, idx) => (
                          <div key={entry.id} className="relative group">
                            <div className="absolute -left-[25px] top-1.5 h-4 w-4 rounded-full border-4 border-white bg-primary-600 shadow-sm" />
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-secondary-300 uppercase tracking-widest">
                                {format(parseISO(entry.date), 'MMM d, yyyy', { locale: dateLocale })}
                              </p>
                              <div className="bg-precision-surface-lowest p-6 rounded-2xl border border-surface-container-low group-hover:border-primary-600/20 transition-all shadow-sm">
                                <p className="text-sm font-bold text-secondary-900 leading-relaxed whitespace-pre-wrap">
                                  {entry.content}
                                </p>
                                {entry.professionals && (
                                  <p className="mt-4 text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="h-3 w-3" /> Recorded by {entry.professionals.full_name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'files' && (
                  <motion.div
                    key="files"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    {history.flatMap(h => h.attachments || []).length === 0 ? (
                      <div className="col-span-2 py-20 text-center space-y-4 opacity-40">
                        <FileText className="h-12 w-12 mx-auto" />
                        <p className="text-xs font-black uppercase tracking-widest">No files uploaded.</p>
                      </div>
                    ) : (
                      history.flatMap(h => h.attachments || []).map((file, idx) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-4 p-4 bg-precision-surface-lowest rounded-2xl border border-surface-container-low hover:border-primary-600/30 transition-all group"
                        >
                          <div className="h-12 w-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary-600">
                            <Download className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-secondary-900 truncate uppercase tracking-widest">{file.name}</p>
                            <p className="text-[10px] font-bold text-secondary-400">PDF Document</p>
                          </div>
                        </a>
                      ))
                    )}
                  </motion.div>
                )}

                {activeTab === 'upcoming' && (
                  <motion.div
                    key="upcoming"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {appointments.length === 0 ? (
                      <div className="py-20 text-center space-y-4 opacity-40">
                        <CalendarDays className="h-12 w-12 mx-auto" />
                        <p className="text-xs font-black uppercase tracking-widest">No upcoming appointments.</p>
                      </div>
                    ) : (
                      appointments.map(app => (
                        <div
                          key={app.id}
                          className="flex items-center justify-between p-6 bg-precision-surface-lowest rounded-2xl border border-surface-container-low hover:border-primary-600/10 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary-600/5 flex items-center justify-center text-primary-600">
                              <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-secondary-900 uppercase tracking-widest">{app.services?.name}</p>
                              <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">
                                {format(parseISO(app.start_at), 'EEEE, MMMM d', { locale: dateLocale })} @ {format(parseISO(app.start_at), 'HH:mm')}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-secondary-200 group-hover:text-primary-600 transition-colors" />
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="p-8 border-t border-surface-container-low bg-white grid grid-cols-2 gap-4">
              <button
                onClick={onAddNote}
                className="flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container-mid text-secondary-900 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                {t.add_note}
              </button>
              <button
                onClick={onScheduleAppointment}
                className="flex items-center justify-center gap-2 bg-secondary-900 hover:bg-secondary-800 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
              >
                <Calendar className="h-4 w-4" />
                {t.schedule_appointment}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
