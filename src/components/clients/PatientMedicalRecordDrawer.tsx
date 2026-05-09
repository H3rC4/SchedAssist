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
    { id: 'upcoming', label: t.upcoming || 'Upcoming', icon: CalendarDays },
    { id: 'files', label: t.patient_files || 'Files', icon: Paperclip },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-primary-950/40 backdrop-blur-[2px]"
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
            <div className="flex items-start justify-between mb-8">
              <div className="min-w-0 flex-1 mr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] bg-primary/5 px-2 py-0.5 rounded-md">
                    {t.medical_record}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-on-surface tracking-tighter leading-none mb-3 truncate">
                  {patient.first_name} <span className="text-primary italic font-serif lowercase">{patient.last_name}</span>
                </h2>
                <div className="flex items-center gap-3">
                  <a 
                    href={`tel:${patient.phone}`}
                    className="flex items-center gap-1.5 text-xs font-bold text-on-surface/60 hover:text-primary transition-colors"
                  >
                    <span className="bg-surface-container-low px-2 py-0.5 rounded-md border border-surface-container-high tracking-widest">
                      {patient.phone}
                    </span>
                  </a>
                  <button 
                    onClick={() => setIsEditingPatient(!isEditingPatient)}
                    className="flex items-center gap-2 px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-primary/10 hover:bg-primary-light transition-all active:scale-95"
                  >
                    {isEditingPatient ? t.cancel : t.edit}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Quick Actions - The "Yellow Box" from user feedback */}
                <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-xl border border-surface-container-high shadow-inner">
                  <a
                    href={`tel:${patient.phone}`}
                    title={t.call}
                    className="p-2 rounded-lg text-on-surface/40 hover:bg-white hover:text-primary hover:shadow-sm transition-all active:scale-90"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                  <a
                    href={`https://wa.me/${patient.phone?.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    title="WhatsApp"
                    className="p-2 rounded-lg text-on-surface/40 hover:bg-white hover:text-emerald-500 hover:shadow-sm transition-all active:scale-90"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </a>
                  {/* Clip button removed per user request */}
                </div>

                <div className="w-px h-8 bg-surface-container-low mx-1" />

                <button
                  onClick={onClose}
                  className="p-2.5 rounded-xl bg-surface-container-low text-on-surface/40 hover:text-on-surface transition-colors border border-surface-container-high shadow-sm hover:shadow-md active:scale-90"
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
                  className="overflow-hidden mb-6 space-y-4 bg-primary/[0.03] p-4 rounded-2xl border border-primary/10"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      value={editFirstName}
                      onChange={e => setEditFirstName(e.target.value)}
                      placeholder={t.first_name}
                      className="bg-white p-3 rounded-xl text-sm font-bold border border-primary/10 outline-none focus:ring-4 focus:ring-primary/10"
                    />
                    <input 
                      value={editLastName}
                      onChange={e => setEditLastName(e.target.value)}
                      placeholder={t.last_name}
                      className="bg-white p-3 rounded-xl text-sm font-bold border border-primary/10 outline-none focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  <input 
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder={t.phone}
                    className="w-full bg-white p-3 rounded-xl text-sm font-bold border border-primary/10 outline-none focus:ring-4 focus:ring-primary/10"
                  />
                  <button
                    onClick={handleUpdatePatientInfo}
                    disabled={isSaving}
                    className="w-full bg-primary text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-primary/20"
                  >
                    {isSaving ? '...' : t.save_changes || t.save}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-low/50 rounded-2xl p-4 border border-surface-container-low">
                <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mb-1">{t.last_visit}</p>
                <p className="text-sm font-bold text-on-surface">
                  {patient.last_visit ? format(new Date(patient.last_visit), 'dd MMM yyyy') : '---'}
                </p>
              </div>
              <div className="bg-surface-container-low/50 rounded-2xl p-4 border border-surface-container-low">
                <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mb-1">{t.status}</p>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${patient.is_active !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <p className="text-sm font-bold text-on-surface">{patient.is_active !== false ? t.active_status : t.inactive_status}</p>
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
                    activeTab === tab.id ? 'text-primary' : 'text-on-surface/50 hover:text-on-surface'
                  }`}
                >
                  <tab.icon className="h-3 w-3" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </motion.div>
              ) : (
                <div className="space-y-8 mt-6">
                  {activeTab === 'history' && (
                    <motion.div
                      key="history"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {isAddingNote && (
                        <div className="bg-primary/[0.03] rounded-3xl p-6 border border-primary/10 shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                              <Plus className="h-3 w-3" />
                            </div>
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">{t.add_note}</h4>
                          </div>
                          <textarea
                            autoFocus
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            placeholder={t.add_comment_placeholder || '...'}
                            className="w-full bg-white rounded-2xl p-4 text-sm font-medium text-on-surface min-h-[120px] border-none ring-1 ring-primary/10 focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none shadow-inner"
                          />
                          <div className="flex items-center gap-3 mt-4">
                            <button
                              onClick={handleSaveNote}
                              disabled={isSaving || !newNoteContent.trim()}
                              className="bg-primary text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-primary/20"
                            >
                              {isSaving ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <FileText className="h-3 w-3" />}
                              {t.save_note || t.save}
                            </button>
                            <button
                              onClick={() => {
                                setIsAddingNote(false);
                                setNewNoteContent('');
                              }}
                              className="text-on-surface/60 hover:text-on-surface px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              {t.cancel}
                            </button>
                          </div>
                        </div>
                      )}

                      {history.length === 0 ? (
                        <div className="py-20 text-center bg-on-surface/[0.02] rounded-[2rem] border border-dashed border-on-surface/10">
                          <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <HistoryIcon className="h-8 w-8 text-on-surface/10" />
                          </div>
                          <p className="text-xs font-black text-on-surface/30 uppercase tracking-[0.3em]">{t.no_history || t.no_remarks_yet}</p>
                          <p className="text-[10px] font-bold text-on-surface/20 uppercase tracking-widest mt-2">{t.createFirst || 'Start by adding a note'}</p>
                        </div>
                      ) : (
                        <div className="relative pl-6 space-y-12 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-surface-container-low">
                          {history.map((record) => (
                            <div key={record.id} className="relative">
                              <div className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-primary ring-4 ring-surface-container-lowest" />
                              <div className="flex items-center gap-2 text-[10px] font-black text-on-surface/40 uppercase tracking-widest mb-3">
                                <Clock className="h-3 w-3" />
                                {format(new Date(record.created_at), 'dd MMM yyyy, HH:mm')}
                              </div>
                              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-surface-container-low">
                                <p className="text-sm font-medium text-on-surface/80 leading-relaxed whitespace-pre-wrap">
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
                                        className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low/80 hover:bg-surface-container-low rounded-xl text-[10px] font-bold text-on-surface/80 transition-colors border border-surface-container-high"
                                      >
                                        <Paperclip className="h-3 w-3 text-on-surface/40" />
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
                        <div className="py-20 text-center bg-on-surface/[0.02] rounded-[2rem] border border-dashed border-on-surface/10">
                          <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Paperclip className="h-8 w-8 text-on-surface/10" />
                          </div>
                          <p className="text-xs font-black text-on-surface/30 uppercase tracking-[0.3em]">{t.no_files || 'No clinical files found'}</p>
                          <p className="text-[10px] font-bold text-on-surface/20 uppercase tracking-widest mt-2">{t.upload_files_desc || 'Studies and clinical documents'}</p>
                        </div>
                      ) : (
                        history.flatMap(h => h.attachments || []).map((file, idx) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-surface-container-low hover:border-primary/30 transition-all group shadow-sm"
                          >
                            <div className="h-10 w-10 bg-surface-container-low rounded-xl flex items-center justify-center text-on-surface/40 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-on-surface truncate">{file.name || 'Untitled File'}</p>
                              <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-0.5">
                                {file.type || 'Document'}
                              </p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-on-surface/40 group-hover:text-primary transition-colors" />
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
                        <div className="py-20 text-center bg-on-surface/[0.02] rounded-[2rem] border border-dashed border-on-surface/10">
                          <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <CalendarDays className="h-8 w-8 text-on-surface/10" />
                          </div>
                          <p className="text-xs font-black text-on-surface/30 uppercase tracking-[0.3em]">{t.no_appointments || 'No upcoming appointments'}</p>
                          <p className="text-[10px] font-bold text-on-surface/20 uppercase tracking-widest mt-2">{t.createFirst || 'Schedule a new visit'}</p>
                        </div>
                      ) : (
                        appointments.map(app => (
                          <div
                            key={app.id}
                            className="flex items-center justify-between p-6 bg-surface-container-lowest rounded-2xl border border-surface-container-low hover:border-primary/10 transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl bg-primary/[0.05] flex items-center justify-center text-primary">
                                <Calendar className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-on-surface uppercase tracking-widest">{app.services?.name}</p>
                                <p className="text-[10px] font-bold text-on-surface/60 uppercase tracking-widest">
                                  {format(parseISO(app.start_at), 'EEEE, MMMM d', { locale: dateLocale })} @ {format(parseISO(app.start_at), 'HH:mm')}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-on-surface/20 group-hover:text-primary transition-colors" />
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
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20"
            >
              <Plus className="h-3 w-3" />
              {t.add_note}
            </button>
            <button
              onClick={onScheduleAppointment}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20"
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
