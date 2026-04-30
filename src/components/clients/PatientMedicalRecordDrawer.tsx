"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, FileText, Plus, ChevronRight, History as HistoryIcon, CalendarDays, Paperclip, ExternalLink, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { it } from 'date-fns/locale/it'
import { enUS } from 'date-fns/locale/en-US'

interface MedicalEntry {
  id: string;
  date?: string;
  created_at: string;
  content: any;
  record_type?: string;
  professionals?: { full_name: string };
  attachments?: { name: string, url: string, type?: string }[];
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  notes: string | null;
  created_at: string;
  last_visit?: string;
  is_active?: boolean;
}

interface PatientMedicalRecordDrawerProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  history: MedicalEntry[];
  appointments: any[];
  lang: 'en' | 'es' | 'it';
  translations: any;
  onAddNote: (content: string) => Promise<void>;
  onUpdatePatient: (id: string, data: any) => Promise<void>;
  onScheduleAppointment: () => void;
  isLoading?: boolean;
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
  onUpdatePatient,
  onScheduleAppointment,
  isLoading = false
}: PatientMedicalRecordDrawerProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'files' | 'upcoming'>('history')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [isEditingPatient, setIsEditingPatient] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  // Edit form state
  const [editFirstName, setEditFirstName] = useState(patient.first_name)
  const [editLastName, setEditLastName] = useState(patient.last_name)
  const [editPhone, setEditPhone] = useState(patient.phone)
  
  const dateLocale = lang === 'it' ? it : (lang === 'es' ? es : enUS)

  const handleSaveNote = async () => {
    if (!newNoteContent.trim()) return;
    setIsSaving(true);
    try {
      await onAddNote(newNoteContent);
      setNewNoteContent('');
      setIsAddingNote(false);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePatientInfo = async () => {
    setIsSaving(true);
    try {
      await onUpdatePatient(patient.id, {
        first_name: editFirstName,
        last_name: editLastName,
        phone: editPhone
      });
      setIsEditingPatient(false);
    } catch (error) {
      console.error('Error updating patient:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!patient || !isOpen) return null;

  const tabs = [
    { id: 'history', label: t.history || 'History', icon: HistoryIcon },
    { id: 'files', label: t.files || 'Files', icon: Paperclip },
    { id: 'upcoming', label: t.upcoming || 'Upcoming', icon: CalendarDays },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-secondary-900/40 backdrop-blur-[2px]"
        />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md h-full bg-surface-container-lowest shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 bg-surface-container-lowest border-b border-surface-container-low">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-secondary-900 tracking-tight leading-none mb-2">
                  {patient.first_name} {patient.last_name}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-secondary-600">
                    <span className="flex items-center gap-1.5 uppercase tracking-widest bg-secondary-100 px-2 py-0.5 rounded-md">
                      {patient.phone}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsEditingPatient(!isEditingPatient)}
                    className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline"
                  >
                    {isEditingPatient ? t.cancel : t.edit}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-surface-container-low text-secondary-600 hover:text-secondary-900 transition-colors border border-surface-container-mid"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {isEditingPatient && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-6 space-y-4 bg-primary-50/30 p-4 rounded-2xl border border-primary-100"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      value={editFirstName}
                      onChange={e => setEditFirstName(e.target.value)}
                      placeholder={t.first_name}
                      className="bg-white p-3 rounded-xl text-sm font-bold border border-primary-100 outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input 
                      value={editLastName}
                      onChange={e => setEditLastName(e.target.value)}
                      placeholder={t.last_name}
                      className="bg-white p-3 rounded-xl text-sm font-bold border border-primary-100 outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <input 
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder={t.phone}
                    className="w-full bg-white p-3 rounded-xl text-sm font-bold border border-primary-100 outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={handleUpdatePatientInfo}
                    disabled={isSaving}
                    className="w-full bg-primary-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
                  >
                    {isSaving ? '...' : t.save_changes || t.save}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-low/50 rounded-2xl p-4 border border-surface-container-low">
                <p className="text-[10px] font-black text-secondary-500 uppercase tracking-widest mb-1">{t.last_visit}</p>
                <p className="text-sm font-bold text-secondary-900">
                  {patient.last_visit ? format(new Date(patient.last_visit), 'dd MMM yyyy') : '---'}
                </p>
              </div>
              <div className="bg-surface-container-low/50 rounded-2xl p-4 border border-surface-container-low">
                <p className="text-[10px] font-black text-secondary-500 uppercase tracking-widest mb-1">{t.status}</p>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${patient.is_active !== false ? 'bg-success-500' : 'bg-secondary-400'}`} />
                  <p className="text-sm font-bold text-secondary-900">{patient.is_active !== false ? t.active_status : t.inactive_status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="px-8 bg-surface-container-lowest border-b border-surface-container-low">
            <div className="flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                    activeTab === tab.id ? 'text-primary-600' : 'text-secondary-500 hover:text-secondary-900'
                  }`}
                >
                  <tab.icon className="h-3 w-3" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-surface-container-lowest custom-scrollbar">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex items-center justify-center"
                >
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </motion.div>
              ) : (
                <div className="space-y-8">
                  {activeTab === 'history' && (
                    <motion.div
                      key="history"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {isAddingNote && (
                        <div className="bg-surface-container-low/30 rounded-3xl p-6 border border-primary-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                              <Plus className="h-3 w-3" />
                            </div>
                            <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{t.add_note}</h4>
                          </div>
                          <textarea
                            autoFocus
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            placeholder={t.add_comment_placeholder || '...'}
                            className="w-full bg-white rounded-2xl p-4 text-sm font-medium text-secondary-900 min-h-[120px] border-none ring-1 ring-surface-container-low focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none shadow-inner"
                          />
                          <div className="flex items-center gap-3 mt-4">
                            <button
                              onClick={handleSaveNote}
                              disabled={isSaving || !newNoteContent.trim()}
                              className="bg-secondary-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all flex items-center gap-2 shadow-md"
                            >
                              {isSaving ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <FileText className="h-3 w-3" />}
                              {t.save_note || t.save}
                            </button>
                            <button
                              onClick={() => {
                                setIsAddingNote(false);
                                setNewNoteContent('');
                              }}
                              className="text-secondary-600 hover:text-secondary-900 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              {t.cancel}
                            </button>
                          </div>
                        </div>
                      )}

                      {history.length === 0 ? (
                        <div className="py-12 text-center">
                          <div className="h-12 w-12 bg-surface-container-low rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="h-6 w-6 text-secondary-400" />
                          </div>
                          <p className="text-sm font-medium text-secondary-600">{t.no_remarks_yet}</p>
                        </div>
                      ) : (
                        <div className="relative pl-6 space-y-12 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-surface-container-low">
                          {history.map((record) => (
                            <div key={record.id} className="relative">
                              <div className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-primary-600 ring-4 ring-surface-container-lowest" />
                              <div className="flex items-center gap-2 text-[10px] font-black text-secondary-500 uppercase tracking-widest mb-3">
                                <Clock className="h-3 w-3" />
                                {format(new Date(record.created_at), 'dd MMM yyyy, HH:mm')}
                              </div>
                              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-surface-container-low">
                                <p className="text-sm font-medium text-secondary-800 leading-relaxed whitespace-pre-wrap">
                                  {record.record_type === 'medical_note' 
                                    ? (typeof record.content === 'string' ? record.content : JSON.stringify(record.content))
                                    : (typeof record.content === 'string' ? record.content : (record.content?.observations || JSON.stringify(record.content)))}
                                </p>
                                {record.attachments && record.attachments.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-surface-container-low flex flex-wrap gap-2">
                                    {record.attachments.map((file, fidx) => (
                                      <a
                                        key={fidx}
                                        href={file.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low/80 hover:bg-surface-container-low rounded-xl text-[10px] font-bold text-secondary-700 transition-colors border border-surface-container-mid"
                                      >
                                        <Paperclip className="h-3 w-3 text-secondary-500" />
                                        {file.name || `File ${fidx + 1}`}
                                      </a>
                                    ))}
                                  </div>
                                )}
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
                      className="grid grid-cols-1 gap-4"
                    >
                      {history.flatMap(h => h.attachments || []).length === 0 ? (
                        <div className="py-12 text-center">
                          <div className="h-12 w-12 bg-surface-container-low rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Paperclip className="h-6 w-6 text-secondary-400" />
                          </div>
                          <p className="text-sm font-medium text-secondary-600">No files found.</p>
                        </div>
                      ) : (
                        history.flatMap(h => h.attachments || []).map((file, idx) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-surface-container-low hover:border-primary-600/30 transition-all group shadow-sm"
                          >
                            <div className="h-10 w-10 bg-surface-container-low rounded-xl flex items-center justify-center text-secondary-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-secondary-900 truncate">{file.name || 'Untitled File'}</p>
                              <p className="text-[10px] font-black text-secondary-500 uppercase tracking-widest mt-0.5">
                                {file.type || 'Document'}
                              </p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-secondary-400 group-hover:text-primary-600 transition-colors" />
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
                            className="flex items-center justify-between p-6 bg-surface-container-lowest rounded-2xl border border-surface-container-low hover:border-primary-600/10 transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl bg-primary-600/5 flex items-center justify-center text-primary-600">
                                <Calendar className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-secondary-900 uppercase tracking-widest">{app.services?.name}</p>
                                <p className="text-[10px] font-bold text-secondary-600 uppercase tracking-widest">
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
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-surface-container-low bg-white grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setActiveTab('history');
                setIsAddingNote(true);
              }}
              className="flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container-mid text-secondary-900 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
            >
              <Plus className="h-3 w-3" />
              {t.add_note}
            </button>
            <button
              onClick={onScheduleAppointment}
              className="flex items-center justify-center gap-2 bg-secondary-900 hover:bg-secondary-800 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
            >
              <Calendar className="h-3 w-3" />
              {t.schedule_appointment}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
