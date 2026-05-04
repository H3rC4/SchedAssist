"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, FileText, Plus, ChevronRight,
  History as HistoryIcon, CalendarDays, Paperclip,
  ExternalLink, AlertCircle, ArrowLeft, Edit2,
  Upload, User, Phone, Mail, ShieldAlert, X, Check, Trash2
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { it } from 'date-fns/locale/it'
import { enUS } from 'date-fns/locale/en-US'
import { createClient } from '@/lib/supabase/client'
import { translations } from '@/lib/i18n'
import { AppointmentDetailDrawer } from '@/components/appointments/AppointmentDetailDrawer'
import { QuickAppointmentDrawer } from '@/components/appointments/QuickAppointmentDrawer'

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

function InlineEdit({ label, value, onSave, multiline = false, icon, t }: {
  label: string;
  value: string;
  onSave: (v: string) => Promise<boolean>;
  multiline?: boolean;
  icon?: React.ReactNode;
  t: any;
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')

  // Sync draft when external value changes (e.g. after save)
  useEffect(() => { if (!editing) setDraft(value) }, [value, editing])

  const handleSave = async () => {
    setSaving(true)
    setStatus('idle')
    const ok = await onSave(draft)
    setSaving(false)
    if (ok) {
      setStatus('ok')
      setEditing(false)
      setTimeout(() => setStatus('idle'), 2000)
    } else {
      setStatus('error')
    }
  }

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-400">{icon}</span>}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        </div>
        {!editing && (
          <button onClick={() => { setDraft(value); setEditing(true); setStatus('idle') }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-primary-600 transition-all">
            <Edit2 className="h-3 w-3" />
          </button>
        )}
      </div>
      {status === 'ok' && !editing && (
        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1">
          <Check className="h-3 w-3" /> {t.saved}
        </p>
      )}
      {status === 'error' && (
        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">{t.save_error}</p>
      )}
      {editing ? (
        <div className="flex flex-col gap-2">
          {multiline ? (
            <textarea value={draft} onChange={e => setDraft(e.target.value)}
              className="w-full bg-white border border-primary-300 rounded-lg p-2 text-sm font-medium text-slate-900 min-h-[80px] outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          ) : (
            <input value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              className="w-full bg-white border border-primary-300 rounded-lg p-2 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500" />
          )}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-1 bg-slate-900 text-white py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-60 transition-all">
              {saving
                ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <Check className="h-3 w-3" />}
              {saving ? t.saving : t.save}
            </button>
            <button onClick={() => { setEditing(false); setStatus('idle') }}
              className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm font-bold text-slate-800 leading-relaxed">{value || <span className="italic text-slate-400">—</span>}</p>
      )}
    </div>
  )
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
  const [isSaving, setIsSaving] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [slotLoading, setSlotLoading] = useState(false)

  const lang = (tenant?.settings?.language as 'en' | 'es' | 'it') || 'es'
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
      if (tuData?.tenants) setTenant(tuData.tenants)
    }
    initTenant()
  }, [supabase])

  const fetchData = useCallback(async () => {
    if (!tenant?.id || !params.id) return
    setIsLoading(true)
    try {
      const [patientRes, historyRes, appointmentsRes] = await Promise.all([
        fetch(`/api/clients/single?id=${params.id}&tenant_id=${tenant.id}`),
        fetch(`/api/clinical-records?client_id=${params.id}&tenant_id=${tenant.id}`),
        fetch(`/api/appointments?client_id=${params.id}&tenant_id=${tenant.id}&upcoming=true`),
      ])
      const patientData = await patientRes.json()
      if (patientData.error) throw new Error(patientData.error)
      setPatient(patientData.client)
      setHistory(await historyRes.json())
      setAppointments(await appointmentsRes.json())
      
      // Also fetch metadata for the appointment drawer
      const [srvRes, profRes] = await Promise.all([
        fetch(`/api/services?tenant_id=${tenant.id}`),
        fetch(`/api/professionals?tenant_id=${tenant.id}`)
      ])
      setServices(await srvRes.json())
      setProfessionals(await profRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [tenant?.id, params.id])

  useEffect(() => { if (tenant?.id) fetchData() }, [fetchData, tenant?.id])

  const saveField = async (field: string, value: string): Promise<boolean> => {
    if (!patient || !tenant) return false
    try {
      const res = await fetch('/api/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: patient.id, tenant_id: tenant.id, data: { [field]: value } })
      })
      if (res.ok) {
        setPatient(prev => prev ? { ...prev, [field]: value } : prev)
        return true
      }
      const err = await res.json()
      console.error('[saveField]', field, err)
      return false
    } catch (e) {
      console.error('[saveField]', e)
      return false
    }
  }

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !patient || !tenant) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/clinical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenant.id, client_id: patient.id, content: newNoteContent, record_type: 'medical_note' })
      })
      if (res.ok) {
        const newRecord = await res.json()
        setHistory([newRecord, ...history])
        setNewNoteContent('')
        setIsAddingNote(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !patient || !tenant) return

    setIsUploading(true)
    setUploadProgress(t.uploading_file)

    try {
      const filePath = `${tenant.id}/${patient.id}/${Date.now()}_${file.name}`
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filePath', filePath)
      formData.append('bucket', 'clinical_files')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json()
        throw new Error(errorData.error || 'Error uploading file')
      }

      const { url: fileUrl } = await uploadRes.json()

      setUploadProgress(t.registering_study)

      const res = await fetch('/api/clinical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          client_id: patient.id,
          content: `${t.study_label}: ${file.name}`,
          record_type: 'study',
          attachments: [{ name: file.name, url: fileUrl, type: file.type }]
        })
      })

      if (res.ok) {
        const newRecord = await res.json()
        setHistory([newRecord, ...history])
        setUploadProgress(t.upload_success)
        setTimeout(() => setUploadProgress(null), 3000)
      }
    } catch (err: any) {
      console.error('[Upload]', err)
      setUploadProgress(`Error: ${err.message}`)
      setTimeout(() => setUploadProgress(null), 3000)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteFile = async (recordId: string, fileUrl: string) => {
    const confirmMsg = t.delete_file_confirm
    if (!window.confirm(confirmMsg)) return

    setIsUploading(true)
    setUploadProgress(t.deleting)

    try {
      // 1. Delete from storage if possible
      const pathPart = fileUrl.split('/clinical_files/')[1]?.split('?')[0]
      if (pathPart) {
        await fetch(`/api/upload?filePath=${pathPart}&bucket=clinical_files`, { method: 'DELETE' })
      }

      // 2. Update database
      const record = history.find(h => h.id === recordId)
      if (!record) return

      const updatedAttachments = (record.attachments || []).filter(a => a.url !== fileUrl)
      
      if (updatedAttachments.length === 0) {
        await fetch(`/api/clinical-records?id=${recordId}`, { method: 'DELETE' })
        setHistory(prev => prev.filter(h => h.id !== recordId))
      } else {
        await fetch(`/api/clinical-records?id=${recordId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attachments: updatedAttachments })
        })
        setHistory(prev => prev.map(h => h.id === recordId ? { ...h, attachments: updatedAttachments } : h))
      }

      setUploadProgress(t.delete_success)
      setTimeout(() => setUploadProgress(null), 3000)
    } catch (err: any) {
      console.error('[DeleteFile]', err)
      setUploadProgress(`Error: ${err.message}`)
      setTimeout(() => setUploadProgress(null), 3000)
    } finally {
      setIsUploading(false)
    }
  }

  const updateAppointmentStatus = async (id: string, status: string): Promise<boolean> => {
    if (!tenant) return false
    try {
      const res = await fetch(`/api/appointments?id=${id}&tenant_id=${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
        if (selectedAppointment?.id === id) {
          setSelectedAppointment({ ...selectedAppointment, status })
        }
        return true
      }
      return false
    } catch (e) {
      console.error(e)
      return false
    }
  }
  const fetchSlots = async (profId: string, date: string) => {
    setSlotLoading(true)
    try {
      const res = await fetch(`/api/appointments/availability?tenant_id=${tenant.id}&professional_id=${profId}&date=${date}`)
      const data = await res.json()
      setAvailableSlots(data.slots || [])
    } finally {
      setSlotLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <AlertCircle className="h-16 w-16 text-slate-300 mb-4" />
        <h1 className="text-2xl font-black text-slate-900 mb-2">{t.error}</h1>
        <button onClick={() => router.back()} className="text-primary-600 font-bold hover:underline">{t.back}</button>
      </div>
    )
  }

  const TABS = [
    { id: 'history', label: t.clinical_history, icon: HistoryIcon },
    { id: 'files', label: t.patient_files, icon: Paperclip },
    { id: 'upcoming', label: t.upcoming_appointments, icon: CalendarDays },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center gap-4 px-6 h-16">
          <button onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-all shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Avatar + name */}
          <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-slate-900 leading-none truncate">
              {patient.first_name || ''} {patient.last_name || ''}
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{t.medical_record}</p>
          </div>

          {/* Right actions — fill the empty orange area */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {t.phone || 'Tel'}: {patient.phone || ''}
            </span>
            <button
              onClick={() => setShowNewAppointment(true)}
              className="flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm active:scale-95">
              <Plus className="h-4 w-4" />
              {t.new_appointment}
            </button>
          </div>
        </div>
      </div>

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT PANEL — straight edges, no rounded corners */}
        <aside className="w-72 shrink-0 bg-white border-r border-slate-200 overflow-y-auto flex flex-col rounded-none">

          {/* Allergies — danger zone */}
          <div className="bg-red-50 border-b border-red-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
              <h2 className="text-[10px] font-black text-red-700 uppercase tracking-widest">{t.allergies}</h2>
            </div>
            <InlineEdit
              label=""
              value={patient.allergies || ''}
              onSave={v => saveField('allergies', v)}
              multiline
              t={t}
            />
          </div>

          {/* Patient data — all editable */}
          <div className="p-5 border-b border-slate-100 space-y-5 flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.patient_info}</p>

            <InlineEdit
              label={t.first_name || 'Nombre'}
              value={patient.first_name || ''}
              onSave={v => saveField('first_name', v)}
              icon={<User className="h-3 w-3" />}
              t={t}
            />
            <InlineEdit
              label={t.last_name || 'Apellido'}
              value={patient.last_name || ''}
              onSave={v => saveField('last_name', v)}
              icon={<User className="h-3 w-3" />}
              t={t}
            />
            <InlineEdit
              label={t.phone || 'Teléfono'}
              value={patient.phone || ''}
              onSave={v => saveField('phone', v)}
              icon={<Phone className="h-3 w-3" />}
              t={t}
            />
            <InlineEdit
              label={t.email || 'Email'}
              value={patient.email || ''}
              onSave={v => saveField('email', v)}
              icon={<Mail className="h-3 w-3" />}
              t={t}
            />
            <InlineEdit
              label={t.notes || 'Notas'}
              value={patient.notes || ''}
              onSave={v => saveField('notes', v)}
              multiline
              t={t}
            />

            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {t.since || 'Miembro desde'}
              </p>
              <p className="text-sm font-bold text-slate-800">{format(new Date(patient.created_at), 'dd MMM yyyy')}</p>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL — tabs */}
        <main className="flex-1 overflow-y-auto flex flex-col bg-slate-50">

          {/* Tab bar */}
          <div className="bg-white border-b border-slate-200 px-6 flex gap-6 shrink-0">
            {TABS.map(tab => (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all relative border-b-2 ${activeTab === tab.id ? 'text-primary-600 border-primary-600' : 'text-slate-500 border-transparent hover:text-slate-900'}`}>
                <tab.icon className="h-3 w-3" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-6 flex-1">
            <AnimatePresence mode="wait">

              {/* HISTORY */}
              {activeTab === 'history' && (
                <motion.div key="history"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900">{t.clinical_history}</h3>
                    <button onClick={() => setIsAddingNote(!isAddingNote)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow active:scale-95 transition-all">
                      <Plus className="h-3 w-3" />
                      {t.add_note}
                    </button>
                  </div>

                  {isAddingNote && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="bg-primary-50 rounded-xl p-5 border border-primary-200">
                      <textarea value={newNoteContent} onChange={e => setNewNoteContent(e.target.value)}
                        placeholder={t.add_comment_placeholder || 'Observaciones clínicas...'}
                        className="w-full bg-white rounded-lg p-3 text-sm font-medium text-slate-900 min-h-[120px] border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                      <div className="flex justify-end gap-3 mt-3">
                        <button onClick={() => { setIsAddingNote(false); setNewNoteContent('') }}
                          className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white rounded-lg border border-slate-200">
                          {t.cancel}
                        </button>
                        <button onClick={handleAddNote} disabled={isSaving || !newNoteContent.trim()}
                          className="px-5 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow disabled:opacity-50">
                          {isSaving ? t.saving : t.save}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {history.length === 0 ? (
                    <div className="py-24 text-center text-slate-400">
                      <HistoryIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">{t.no_history}</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-slate-200">
                      {history.map(record => (
                        <div key={record.id} className="relative">
                          <div className="absolute -left-[29px] top-2 h-4 w-4 rounded-full bg-primary-600 ring-4 ring-white" />
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 px-2 py-1 rounded">
                              {format(new Date(record.created_at), 'dd MMM yyyy, HH:mm')}
                            </span>
                            {record.professionals && (
                              <span className="text-[10px] font-black text-slate-500 uppercase">
                                {t.by_label} {record.professionals.full_name}
                              </span>
                            )}
                          </div>
                          <div className="bg-white border-y sm:border sm:rounded-none sm:border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-5">
                              <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                                {typeof record.content === 'string' ? record.content : (record.content?.observations || JSON.stringify(record.content))}
                              </p>
                              {record.attachments && record.attachments.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {record.attachments.map((file, fidx) => (
                                    <a key={fidx} href={file.url} target="_blank" rel="noreferrer"
                                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 border border-slate-200 transition-colors">
                                      <Paperclip className="h-3 w-3 text-slate-400" />
                                      {file.name || `Archivo ${fidx + 1}`}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* FILES */}
              {activeTab === 'files' && (
                <motion.div key="files"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-6">

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileUpload}
                  />

                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900">{t.patient_files || 'Estudios y Archivos'}</h3>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow active:scale-95 transition-all disabled:opacity-60">
                      {isUploading
                        ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        : <Upload className="h-3 w-3" />}
                      {isUploading ? t.saving : (t.add_study || 'Agregar Estudio')}
                    </button>
                  </div>

                  {/* Upload progress */}
                  {uploadProgress && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold ${
                        uploadProgress.startsWith('✓')
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : uploadProgress.startsWith('Error')
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                      {isUploading && <div className="h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current" />}
                      {uploadProgress}
                    </motion.div>
                  )}

                  {history.flatMap(h => h.attachments || []).length === 0 && !isUploading ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="py-24 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-primary-300 hover:text-primary-400 transition-all">
                      <Upload className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-bold">{t.no_files_desc}</p>
                      <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, DOC, XLS</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {history.filter(h => h.attachments && h.attachments.length > 0).map(record => (
                        record.attachments?.map((file, fidx) => (
                          <div key={`${record.id}-${fidx}`} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-primary-600/30 transition-all group shadow-sm">
                            <a href={file.url} target="_blank" rel="noreferrer" className="h-10 w-10 bg-slate-100 rounded-none flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                              <FileText className="h-5 w-5" />
                            </a>
                            <div className="flex-1 min-w-0">
                              <a href={file.url} target="_blank" rel="noreferrer">
                                <p className="text-sm font-bold text-slate-900 truncate hover:text-primary-600 transition-colors cursor-pointer">{file.name || t.document_fallback}</p>
                              </a>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{file.type || t.clinical_study_label}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDeleteFile(record.id, file.url)}
                                className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title={lang === 'es' ? 'Eliminar' : 'Delete'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <a href={file.url} target="_blank" rel="noreferrer" className="p-2 text-slate-300 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        ))
                      ))}
                    </div>
                  )}
                </motion.div>
              )}


              {/* UPCOMING */}
              {activeTab === 'upcoming' && (
                <motion.div key="upcoming"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900">{t.upcoming_appointments}</h3>
                  </div>
                  {appointments.length === 0 ? (
                    <div className="py-24 text-center text-slate-400">
                      <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">{t.no_appointments}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appointments.map(app => (
                        <div key={app.id}
                          onClick={() => setSelectedAppointment(app)}
                          className="flex items-center justify-between p-5 bg-white rounded-xl border border-slate-200 hover:border-primary-600/30 cursor-pointer transition-all group shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-primary-600 shadow-sm group-hover:border-primary-600 transition-all">
                              <span className="text-[9px] font-black uppercase">{format(parseISO(app.start_at), 'MMM')}</span>
                              <span className="text-base font-black">{format(parseISO(app.start_at), 'dd')}</span>
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{app.services?.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                                  <Clock className="h-3 w-3" />
                                  {format(parseISO(app.start_at), 'HH:mm')}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                  {format(parseISO(app.start_at), 'EEEE, MMMM d', { locale: dateLocale })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {selectedAppointment && (
          <AppointmentDetailDrawer
            appointment={selectedAppointment}
            lang={lang}
            onClose={() => setSelectedAppointment(null)}
            onSuccess={() => fetchData()}
            tenantId={tenant.id}
            translations={t}
            onReschedule={(app) => {
              if (app?.clients) {
                const params = new URLSearchParams({
                  action: 'reschedule',
                  patient_id: app.clients.id,
                  first_name: app.clients.first_name,
                  last_name: app.clients.last_name || '',
                  phone: app.clients.phone || ''
                })
                router.push(`/dashboard/appointments?${params.toString()}`)
              }
              setSelectedAppointment(null)
            }}
            onUpdateStatus={updateAppointmentStatus}
          />
        )}

        {showNewAppointment && (
          <QuickAppointmentDrawer
            tenantId={tenant.id}
            lang={lang}
            services={services}
            professionals={professionals}
            onClose={() => setShowNewAppointment(false)}
            onSuccess={() => {
              fetchData()
              setShowNewAppointment(false)
            }}
            selectedDate={new Date()}
            translations={t}
            availableSlots={availableSlots}
            slotLoading={slotLoading}
            onFetchSlots={fetchSlots}
            initialPatient={{
              first_name: patient.first_name,
              last_name: patient.last_name || '',
              phone: patient.phone
            }}
            variant="drawer"
          />
        )}
      </AnimatePresence>
    </div>
  )
}
