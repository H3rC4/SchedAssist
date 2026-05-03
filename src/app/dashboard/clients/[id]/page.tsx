"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Calendar, Clock, FileText, Plus, ChevronRight, 
  History as HistoryIcon, CalendarDays, Paperclip, 
  ExternalLink, AlertCircle, ArrowLeft, Edit2, 
  Save, Trash2, User, Phone, Mail, ShieldAlert
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { it } from 'date-fns/locale/it'
import { enUS } from 'date-fns/locale/en-US'
import { createClient } from '@/lib/supabase/client'
import { translations } from '@/lib/i18n'

interface MedicalEntry {
  id: string;
  created_at: string;
  content: any;
  professionals?: { full_name: string };
  attachments?: { name: string, url: string, type?: string }[];
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  notes: string | null;
  allergies?: string | null;
  created_at: string;
}

export default function PatientProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  
  const [tenant, setTenant] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'history' | 'files' | 'upcoming'>('history')
  const [isLoading, setIsLoading] = useState(true)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [history, setHistory] = useState<MedicalEntry[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [isEditingAllergies, setIsEditingAllergies] = useState(false)
  const [allergiesDraft, setAllergiesDraft] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)

  const lang = (tenant?.settings?.language as 'en'|'es'|'it') || 'es'
  const t = translations[lang] || translations['en']
  const dateLocale = lang === 'it' ? it : (lang === 'es' ? es : enUS)

  useEffect(() => {
    async function initTenant() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: tuData } = await supabase
        .from('tenant_users')
        .select('tenant_id, role, tenants(id, name, slug, settings)')
        .eq('user_id', user.id)
        .limit(1).single()
      if (tuData?.tenants) {
        setTenant(tuData.tenants)
      }
    }
    initTenant()
  }, [supabase])

  const fetchData = useCallback(async () => {
    if (!tenant?.id || !params.id) return;
    setIsLoading(true);
    try {
      // Fetch Patient
      const patientRes = await fetch(`/api/clients/single?id=${params.id}&tenant_id=${tenant.id}`);
      const patientData = await patientRes.json();
      if (patientData.error) throw new Error(patientData.error);
      setPatient(patientData.client);
      setAllergiesDraft(patientData.client.allergies || '');

      // Fetch History
      const historyRes = await fetch(`/api/clinical-records?client_id=${params.id}&tenant_id=${tenant.id}`);
      const historyData = await historyRes.json();
      setHistory(historyData);

      // Fetch Appointments (Next appointments)
      const appointmentsRes = await fetch(`/api/appointments?client_id=${params.id}&tenant_id=${tenant.id}&upcoming=true`);
      const appointmentsData = await appointmentsRes.json();
      setAppointments(appointmentsData);

    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id, params.id]);

  useEffect(() => {
    if (tenant?.id) fetchData();
  }, [fetchData, tenant?.id]);

  const handleSaveAllergies = async () => {
    if (!patient || !tenant) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: patient.id,
          tenant_id: tenant.id,
          data: { allergies: allergiesDraft }
        })
      });
      if (res.ok) {
        setPatient({ ...patient, allergies: allergiesDraft });
        setIsEditingAllergies(false);
      }
    } catch (error) {
      console.error('Error saving allergies:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !patient || !tenant) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/clinical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          client_id: patient.id,
          content: newNoteContent,
          record_type: 'medical_note'
        })
      });
      if (res.ok) {
        const newRecord = await res.json();
        setHistory([newRecord, ...history]);
        setNewNoteContent('');
        setIsAddingNote(false);
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center p-8">
        <AlertCircle className="h-16 w-16 text-secondary-300 mb-4" />
        <h1 className="text-2xl font-black text-secondary-900 mb-2">{t.error || 'Patient Not Found'}</h1>
        <button 
          onClick={() => router.back()}
          className="text-primary-600 font-bold hover:underline"
        >
          {t.back || 'Go back to patients list'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      {/* Top Header / Navigation */}
      <div className="bg-white border-b border-surface-container-low sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="p-2 rounded-xl hover:bg-surface-container-low text-secondary-600 transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-secondary-900 leading-none">
                    {patient.first_name} {patient.last_name}
                  </h1>
                  <p className="text-[10px] font-black text-secondary-500 uppercase tracking-widest mt-1">
                    {t.medical_record}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push('/dashboard/calendar')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-secondary-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                <Plus className="h-3 w-3" />
                {t.new_appointment || 'New Appointment'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Basic Info & Allergies */}
          <div className="lg:col-span-1 space-y-8">
            {/* Allergies Card (Priority) */}
            <div className="bg-error-50 rounded-[2.5rem] p-8 border border-error-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldAlert className="h-16 w-16 text-error-600" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[10px] font-black text-error-700 uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert className="h-3 w-3" />
                    {t.allergies}
                  </h2>
                  <button 
                    onClick={() => setIsEditingAllergies(!isEditingAllergies)}
                    className="p-2 rounded-xl hover:bg-error-100 text-error-600 transition-all"
                  >
                    {isEditingAllergies ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                  </button>
                </div>

                {isEditingAllergies ? (
                  <div className="space-y-4">
                    <textarea 
                      value={allergiesDraft}
                      onChange={(e) => setAllergiesDraft(e.target.value)}
                      placeholder={t.edit_allergies}
                      className="w-full bg-white rounded-2xl p-4 text-sm font-bold text-secondary-900 min-h-[100px] border-none ring-1 ring-error-200 focus:ring-2 focus:ring-error-500 outline-none transition-all resize-none shadow-inner"
                    />
                    <button 
                      onClick={handleSaveAllergies}
                      disabled={isSaving}
                      className="w-full bg-error-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {isSaving ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="h-3 w-3" />}
                      {t.save}
                    </button>
                  </div>
                ) : (
                  <p className={`text-sm font-bold ${patient.allergies ? 'text-error-900' : 'text-error-400 italic'}`}>
                    {patient.allergies || (lang === 'es' ? 'No se reportan alergias' : (lang === 'it' ? 'Nessuna allergia riportata' : 'No allergies reported'))}
                  </p>
                )}
              </div>
            </div>

            {/* Patient Info Card */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-surface-container-low shadow-sm">
              <h2 className="text-[10px] font-black text-secondary-500 uppercase tracking-widest mb-6">
                {t.patient_info}
              </h2>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-surface-container-low flex items-center justify-center text-secondary-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest leading-none mb-1">{t.phone || 'Phone'}</p>
                    <p className="text-sm font-bold text-secondary-900">{patient.phone}</p>
                  </div>
                </div>
                {patient.email && (
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-surface-container-low flex items-center justify-center text-secondary-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest leading-none mb-1">Email</p>
                      <p className="text-sm font-bold text-secondary-900">{patient.email}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-surface-container-low flex items-center justify-center text-secondary-400">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest leading-none mb-1">{t.since || 'Member Since'}</p>
                    <p className="text-sm font-bold text-secondary-900">{format(new Date(patient.created_at), 'dd MMM yyyy')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* General Notes Card */}
            <div className="bg-primary-50/30 rounded-[2.5rem] p-8 border border-primary-100 shadow-sm">
              <h2 className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-4">
                {t.notes_label || 'General Notes'}
              </h2>
              <p className="text-sm font-medium text-secondary-800 leading-relaxed whitespace-pre-wrap">
                {patient.notes || (lang === 'es' ? 'Sin notas generales.' : (lang === 'it' ? 'Nessuna nota generale.' : 'No general notes available.'))}
              </p>
            </div>
          </div>

          {/* Right Column: Main Dashboard (Tabs) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-surface-container-low shadow-sm flex flex-col min-h-[600px]">
              {/* Tabs Navigation */}
              <div className="px-8 border-b border-surface-container-low">
                <div className="flex gap-8">
                  {[
                    { id: 'history', label: t.clinical_history, icon: HistoryIcon },
                    { id: 'files', label: t.patient_files, icon: Paperclip },
                    { id: 'upcoming', label: t.upcoming_appointments, icon: CalendarDays },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                        activeTab === tab.id ? 'text-primary-600' : 'text-secondary-500 hover:text-secondary-900'
                      }`}
                    >
                      <tab.icon className="h-3 w-3" />
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTabProfile"
                          className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-t-full"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-8 flex-1">
                <AnimatePresence mode="wait">
                  {activeTab === 'history' && (
                    <motion.div
                      key="history"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-secondary-900 tracking-tight">{t.clinical_history}</h3>
                        <button 
                          onClick={() => setIsAddingNote(!isAddingNote)}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-md"
                        >
                          <Plus className="h-3 w-3" />
                          {t.add_note}
                        </button>
                      </div>

                      {isAddingNote && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-primary-50/50 rounded-3xl p-6 border border-primary-100"
                        >
                          <textarea
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            placeholder={t.add_comment_placeholder || 'Type clinical observations...'}
                            className="w-full bg-white rounded-2xl p-4 text-sm font-medium text-secondary-900 min-h-[150px] border-none ring-1 ring-primary-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none shadow-inner"
                          />
                          <div className="flex justify-end gap-3 mt-4">
                            <button 
                              onClick={() => {setIsAddingNote(false); setNewNoteContent('')}}
                              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-secondary-500"
                            >
                              {t.cancel}
                            </button>
                            <button 
                              onClick={handleAddNote}
                              disabled={isSaving || !newNoteContent.trim()}
                              className="px-6 py-2 bg-secondary-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
                            >
                              {isSaving ? 'Saving...' : t.save}
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {history.length === 0 ? (
                        <div className="py-20 text-center text-secondary-400">
                          <HistoryIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p className="text-sm font-medium">{t.no_history}</p>
                        </div>
                      ) : (
                        <div className="relative pl-8 space-y-12 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-surface-container-low">
                          {history.map((record) => (
                            <div key={record.id} className="relative">
                              <div className="absolute -left-[37px] top-2 h-4 w-4 rounded-full bg-primary-600 ring-4 ring-white" />
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 px-2 py-1 rounded-md">
                                  {format(new Date(record.created_at), 'dd MMM yyyy, HH:mm')}
                                </span>
                                {record.professionals && (
                                  <span className="text-[10px] font-black text-secondary-500 uppercase tracking-widest">
                                    {lang === 'es' ? 'por' : (lang === 'it' ? 'da' : 'by')} {record.professionals.full_name}
                                  </span>
                                )}
                              </div>
                              <div className="bg-surface-container-lowest border border-surface-container-low rounded-[2rem] p-6 shadow-sm">
                                <p className="text-sm font-medium text-secondary-800 leading-relaxed whitespace-pre-wrap">
                                  {typeof record.content === 'string' ? record.content : (record.content?.observations || JSON.stringify(record.content))}
                                </p>
                                {record.attachments && record.attachments.length > 0 && (
                                  <div className="mt-6 flex flex-wrap gap-3">
                                    {record.attachments.map((file, fidx) => (
                                      <a
                                        key={fidx}
                                        href={file.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-surface-container-low/50 hover:bg-surface-container-low rounded-xl text-[10px] font-bold text-secondary-700 transition-colors border border-surface-container-mid"
                                      >
                                        <Paperclip className="h-3 w-3 text-secondary-400" />
                                        {file.name || `Attachment ${fidx + 1}`}
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
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-secondary-900 tracking-tight">{t.patient_files}</h3>
                        <button className="flex items-center gap-2 px-4 py-2 bg-secondary-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md">
                          <Plus className="h-3 w-3" />
                          {t.add_study}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {history.flatMap(h => h.attachments || []).length === 0 ? (
                          <div className="col-span-full py-20 text-center text-secondary-400">
                            <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-medium">{t.no_files}</p>
                          </div>
                        ) : (
                          history.flatMap(h => h.attachments || []).map((file, idx) => (
                            <a
                              key={idx}
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-surface-container-low hover:border-primary-600/30 transition-all group shadow-sm"
                            >
                              <div className="h-12 w-12 bg-surface-container-low rounded-2xl flex items-center justify-center text-secondary-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                <FileText className="h-6 w-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-secondary-900 truncate">{file.name || 'Untitled Study'}</p>
                                <p className="text-[10px] font-black text-secondary-500 uppercase tracking-widest mt-1">
                                  {file.type || 'Clinical Document'}
                                </p>
                              </div>
                              <ExternalLink className="h-4 w-4 text-secondary-300 group-hover:text-primary-600 transition-colors" />
                            </a>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'upcoming' && (
                    <motion.div
                      key="upcoming"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-secondary-900 tracking-tight">{t.upcoming_appointments}</h3>
                      </div>

                      <div className="space-y-4">
                        {appointments.length === 0 ? (
                          <div className="py-20 text-center text-secondary-400">
                            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-medium">{t.no_appointments}</p>
                          </div>
                        ) : (
                          appointments.map(app => (
                            <div
                              key={app.id}
                              onClick={() => router.push(`/dashboard/calendar?appointment_id=${app.id}`)}
                              className="flex items-center justify-between p-6 bg-surface-container-low/20 rounded-[2rem] border border-surface-container-low hover:border-primary-600/20 cursor-pointer transition-all group"
                            >
                              <div className="flex items-center gap-5">
                                <div className="h-14 w-14 rounded-2xl bg-white border border-surface-container-low flex flex-col items-center justify-center text-primary-600 shadow-sm group-hover:border-primary-600 group-hover:shadow-md transition-all">
                                  <span className="text-[10px] font-black uppercase">{format(parseISO(app.start_at), 'MMM')}</span>
                                  <span className="text-lg font-black">{format(parseISO(app.start_at), 'dd')}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-black text-secondary-900 uppercase tracking-tight">{app.services?.name}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-secondary-500 uppercase">
                                      <Clock className="h-3 w-3" />
                                      {format(parseISO(app.start_at), 'HH:mm')}
                                    </span>
                                    <span className="text-secondary-300">•</span>
                                    <span className="text-[10px] font-bold text-secondary-500 uppercase">
                                      {format(parseISO(app.start_at), 'EEEE, MMMM d', { locale: dateLocale })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-secondary-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
