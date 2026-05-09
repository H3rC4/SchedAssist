"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, FileText, Plus, ChevronRight,
  History as HistoryIcon, CalendarDays, Paperclip,
  ExternalLink, AlertCircle, ArrowLeft, Edit2,
  Upload, User, Phone, Mail, ShieldAlert, X, Check, Trash2,
  MessageSquare, AlertTriangle, Activity, Bell, CreditCard, CheckCircle2,
  MapPin, Briefcase, Fingerprint, QrCode
} from 'lucide-react'
import { format, parseISO, differenceInYears } from 'date-fns'
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
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editNoteContent, setEditNoteContent] = useState('')
  const [fileSearch, setFileSearch] = useState('')
  const [fileFilter, setFileFilter] = useState<'all' | 'study' | 'consent' | 'other'>('all')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [slotLoading, setSlotLoading] = useState(false)

  // ── TIMELINE LOGIC ──────────────────────────────────────────────
  const timelineItems = useEffect(() => {}, []) // Cleaning up previous mistake if any

  const combinedTimeline = (history: MedicalEntry[], appointments: any[]) => {
    const records = history.map(h => ({
      id: h.id,
      type: h.attachments && h.attachments.length > 0 ? 'study' : 'note' as const,
      date: new Date(h.created_at),
      title: h.attachments && h.attachments.length > 0 ? (h.attachments[0].name || 'Estudio') : 'Nota Médica',
      description: typeof h.content === 'string' ? h.content : (h.content?.observations || ''),
      professionals: h.professionals,
      raw: h
    }))

    const apps = appointments.map(a => ({
      id: a.id,
      type: 'appointment' as const,
      date: new Date(`${a.date}T${a.time || '00:00'}`),
      title: 'Turno Programado',
      description: `${a.services?.name || 'Servicio'} con ${a.professionals?.full_name || 'Profesional'}`,
      status: a.status,
      raw: a
    }))

    const patientCreated = patient ? [{
      id: 'creation',
      type: 'system' as const,
      date: new Date(patient.created_at),
      title: 'Paciente Registrado',
      description: 'El paciente fue dado de alta en el sistema.',
      icon: CheckCircle2
    }] : []

    return [...records, ...apps, ...patientCreated].sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  const items = combinedTimeline(history, appointments)

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

  const handleDeleteNote = async (recordId: string) => {
    const confirmMsg = lang === 'es' ? '¿Eliminar este registro?' : 'Delete this record?'
    if (!window.confirm(confirmMsg)) return
    try {
      const res = await fetch(`/api/clinical-records?id=${recordId}`, { method: 'DELETE' })
      if (res.ok) {
        setHistory(prev => prev.filter(h => h.id !== recordId))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleEditNote = async (recordId: string, newContent: string) => {
    try {
      const res = await fetch(`/api/clinical-records?id=${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      })
      if (res.ok) {
        setHistory(prev => prev.map(h => h.id === recordId ? { ...h, content: newContent } : h))
        return true
      }
      return false
    } catch (e) {
      console.error(e)
      return false
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
      <div className="flex-1 min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="h-24 w-24 border-[4px] border-primary/10 border-t-primary animate-spin rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <User className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>
        <p className="mt-8 text-xs font-black text-[#191c1e] uppercase tracking-[0.4em] animate-pulse">
          {(t as any).loading || 'Cargando Paciente'}
        </p>
        <p className="mt-3 text-[10px] font-bold text-[#191c1e]/40 uppercase tracking-widest">
          {(t as any).loading_desc || 'Recuperando historial...'}
        </p>
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

          {/* Right actions — quick actions bar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Actions Group */}
            <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              {/* Call */}
              <a
                href={`tel:${patient.phone}`}
                title={t.call}
                className="p-2.5 rounded-xl text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all active:scale-95"
              >
                <Phone className="h-4 w-4" />
              </a>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/${patient.phone?.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                title="WhatsApp"
                className="p-2.5 rounded-xl text-slate-600 hover:bg-white hover:text-emerald-600 hover:shadow-sm transition-all active:scale-95"
              >
                <MessageSquare className="h-4 w-4" />
              </a>

              {/* Send Email */}
              {patient.email && (
                <a
                  href={`mailto:${patient.email}`}
                  title={t.email}
                  className="p-2.5 rounded-xl text-slate-600 hover:bg-white hover:text-amber-600 hover:shadow-sm transition-all active:scale-95"
                >
                  <Mail className="h-4 w-4" />
                </a>
              )}
              
              <div className="w-px h-4 bg-slate-200 mx-1" />

              {/* Upload File shortcut */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title={t.add_study}
                className="p-2.5 rounded-xl text-slate-600 hover:bg-white hover:text-primary-600 hover:shadow-sm transition-all active:scale-95"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </div>

            <div className="w-px h-6 bg-slate-200 mx-1" />

            <button
              onClick={() => setShowNewAppointment(true)}
              className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              {t.new_appointment}
            </button>
          </div>
        </div>
      </div>

      {/* ── CRITICAL ALERTS BANNER ────────────────────────────────────────── */}
      <AnimatePresence>
        {patient.allergies && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-red-600 to-red-500 border-b border-red-700 overflow-hidden relative"
          >
            {/* Decorative background icon */}
            <ShieldAlert className="absolute right-10 top-1/2 -translate-y-1/2 h-24 w-24 text-white/5 pointer-events-none" />

            <div className="px-6 py-4 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-white/20 backdrop-blur-md flex items-center justify-center rounded-xl shadow-inner shadow-white/20">
                  <AlertTriangle className="h-5 w-5 text-white animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] leading-none">
                      {t.critical_alert}
                    </p>
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                  </div>
                  <p className="text-base font-black text-white leading-none tracking-tight">
                    {t.allergies}: <span className="uppercase">{patient.allergies}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => saveField('allergies', '')}
                  className="p-2 text-white/50 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT PANEL — High Fidelity Patient Identity Card */}
        <aside className="w-80 shrink-0 bg-white border-r border-slate-200 overflow-y-auto flex flex-col rounded-none scrollbar-hide">
          
          {/* 1. PROFILE HEADER CARD */}
          <div className="p-6 bg-slate-50/50 border-b border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-3xl bg-primary text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-primary/20 mb-4 border-4 border-white">
                {patient.first_name[0]}{patient.last_name?.[0]}
              </div>
              <h2 className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tight">
                {patient.first_name} <br />
                <span className="text-primary">{patient.last_name}</span>
              </h2>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
                  {t.active_member || 'Activo'}
                </span>
                <span className="px-3 py-1 bg-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
                  {t.patient_id || 'ID'}: #{patient.id.slice(0, 5)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. CRITICAL HEALTH INFO (If exists) */}
          <AnimatePresence>
            {patient.allergies && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="bg-rose-50 p-5 border-b border-rose-100"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 bg-rose-100 rounded-lg flex items-center justify-center">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                  </div>
                  <h3 className="text-[10px] font-black text-rose-700 uppercase tracking-widest">{t.allergies}</h3>
                </div>
                <InlineEdit
                  label=""
                  value={patient.allergies || ''}
                  onSave={v => saveField('allergies', v)}
                  multiline
                  t={t}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3. CONTACT INFO SECTION */}
          <div className="p-6 space-y-6 border-b border-slate-100">
            <div className="flex items-center gap-2 opacity-40">
              <div className="h-px flex-1 bg-slate-900" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">{t.contact || 'Contacto'}</span>
              <div className="h-px flex-1 bg-slate-900" />
            </div>

            <InlineEdit
              label={t.phone || 'Teléfono'}
              value={patient.phone || ''}
              onSave={v => saveField('phone', v)}
              icon={<Phone className="h-3.5 w-3.5" />}
              t={t}
            />
            <InlineEdit
              label={t.email || 'Email'}
              value={patient.email || ''}
              onSave={v => saveField('email', v)}
              icon={<Mail className="h-3.5 w-3.5" />}
              t={t}
            />
            <InlineEdit
              label={t.address || 'Dirección'}
              value={patient.address || ''}
              onSave={v => saveField('address', v)}
              icon={<MapPin className="h-3.5 w-3.5" />}
              t={t}
            />
          </div>

          {/* 4. IDENTITY & CLINICAL CONTEXT */}
          <div className="p-6 space-y-6 border-b border-slate-100">
            <div className="flex items-center gap-2 opacity-40">
              <div className="h-px flex-1 bg-slate-900" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">{t.identity || 'Identidad'}</span>
              <div className="h-px flex-1 bg-slate-900" />
            </div>

            <InlineEdit
              label={t.dni || 'DNI / NIE'}
              value={patient.dni || ''}
              onSave={v => saveField('dni', v)}
              icon={<Fingerprint className="h-3.5 w-3.5" />}
              t={t}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <InlineEdit
                label={t.birth_date || 'Nacimiento'}
                value={patient.birth_date || ''}
                onSave={v => saveField('birth_date', v)}
                icon={<Calendar className="h-3.5 w-3.5" />}
                t={t}
              />
              <div className="flex flex-col gap-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.age || 'Edad'}</span>
                <span className="text-sm font-black text-primary">
                  {patient.birth_date ? (
                    `${differenceInYears(new Date(), new Date(patient.birth_date))} ${t.years_old || 'años'}`
                  ) : '--'}
                </span>
              </div>
            </div>

            <InlineEdit
              label={t.gender || 'Género'}
              value={patient.gender || ''}
              onSave={v => saveField('gender', v)}
              icon={<User className="h-3.5 w-3.5" />}
              t={t}
            />
            <InlineEdit
              label={t.occupation || 'Ocupación'}
              value={patient.occupation || ''}
              onSave={v => saveField('occupation', v)}
              icon={<Briefcase className="h-3.5 w-3.5" />}
              t={t}
            />
          </div>

          {/* 5. GENERAL NOTES */}
          <div className="p-6 flex-1">
             <div className="flex items-center gap-2 mb-4 opacity-40">
              <div className="h-px flex-1 bg-slate-900" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">{t.notes || 'Observaciones'}</span>
              <div className="h-px flex-1 bg-slate-900" />
            </div>
            <InlineEdit
              label=""
              value={patient.notes || ''}
              onSave={v => saveField('notes', v)}
              multiline
              t={t}
            />
          </div>

          {/* 6. FOOTER METADATA */}
          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.since || 'Registrado desde'}</p>
                <p className="text-xs font-bold text-slate-800">{format(new Date(patient.created_at), 'dd MMM yyyy')}</p>
              </div>
              <div className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center">
                <QrCode className="h-5 w-5 text-slate-300" />
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL — tabs */}
        <main className="flex-1 overflow-y-auto flex flex-col bg-slate-50">

          {/* Tab bar */}
          <div className="bg-white border-b border-slate-200 px-6 flex gap-6 shrink-0 sticky top-0 z-20">
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

                  {items.length === 0 ? (
                    <div className="py-24 text-center text-slate-400">
                      <HistoryIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">{t.no_history}</p>
                    </div>
                  ) : (
                    <div className="relative pl-10 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
                      {items.map(item => {
                        const Icon = item.type === 'appointment' ? CalendarDays : (item.type === 'study' ? Paperclip : (item.type === 'system' ? CheckCircle2 : FileText))
                        const colorClass = item.type === 'appointment' ? 'bg-blue-500' : (item.type === 'study' ? 'bg-purple-500' : (item.type === 'system' ? 'bg-emerald-500' : 'bg-slate-500'))
                        const lightBg = item.type === 'appointment' ? 'bg-blue-50' : (item.type === 'study' ? 'bg-purple-50' : (item.type === 'system' ? 'bg-emerald-50' : 'bg-slate-50'))
                        const iconColor = item.type === 'appointment' ? 'text-blue-600' : (item.type === 'study' ? 'text-purple-600' : (item.type === 'system' ? 'text-emerald-600' : 'text-slate-600'))
                        
                        return (
                           <div key={item.id} className="relative group/item">
                            {/* Dot on line */}
                            <div className={`absolute -left-[45px] top-1.5 h-6 w-6 rounded-full ${colorClass} ring-4 ring-white z-10 flex items-center justify-center shadow-lg shadow-slate-200`}>
                              <Icon className="h-3 w-3 text-white" />
                            </div>
                            
                            {/* Content */}
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-100">
                                    {format(item.date, 'dd MMM yyyy, HH:mm')}
                                  </span>
                                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${lightBg} ${iconColor} border border-current/10`}>
                                    {item.type === 'appointment' ? (t.appointment || 'Cita') : (item.type === 'study' ? (t.study_label || 'Estudio') : (item.type === 'system' ? 'Sistema' : (t.note || 'Nota')))}
                                  </div>
                                </div>
                                
                                {item.type === 'note' && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingNoteId(item.id); setEditNoteContent(item.description); }} className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg bg-white border border-slate-200 transition-all hover:shadow-md active:scale-95">
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button onClick={() => handleDeleteNote(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg bg-white border border-slate-200 transition-all hover:shadow-md active:scale-95">
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                                
                                {item.type === 'appointment' && (
                                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                                    item.status === 'confirmed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                                    item.status === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                                    'bg-slate-50 border-slate-200 text-slate-600'
                                  }`}>
                                    {t[item.status] || item.status}
                                  </div>
                                )}
                              </div>
                              
                              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden group-hover/item:border-primary-200 group-hover/item:shadow-md transition-all duration-300">
                                <div className="p-5">
                                  {editingNoteId === item.id ? (
                                    <div className="space-y-4">
                                      <textarea 
                                        value={editNoteContent} 
                                        onChange={e => setEditNoteContent(e.target.value)}
                                        className="w-full bg-slate-50 rounded-xl p-4 text-sm font-medium text-slate-900 min-h-[120px] border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 resize-none transition-all"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingNoteId(null)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                          {t.cancel}
                                        </button>
                                        <button onClick={async () => {
                                          if (await handleEditNote(item.id, editNoteContent)) {
                                            setEditingNoteId(null);
                                          }
                                        }} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 rounded-xl shadow-lg shadow-slate-900/20 active:scale-95 transition-all">
                                          {t.save}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-start justify-between gap-4 mb-2">
                                        <h4 className="text-sm font-black text-slate-900 tracking-tight">{item.title}</h4>
                                        {item.type === 'appointment' && (
                                          <button 
                                            onClick={() => setSelectedAppointment(item.raw)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                                          >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                      </div>
                                      <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {item.description}
                                      </p>
                                      
                                      {item.type === 'study' && item.raw.attachments && (
                                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          {item.raw.attachments.map((file: any, fidx: number) => (
                                            <a key={fidx} href={file.url} target="_blank" rel="noreferrer" 
                                              className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-primary-400 hover:bg-white transition-all group/file shadow-sm hover:shadow-md">
                                              <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover/file:text-primary-600 group-hover/file:border-primary-100 transition-all">
                                                <FileText className="h-4 w-4" />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight">{file.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Click to view</p>
                                              </div>
                                              <ExternalLink className="h-3 w-3 text-slate-300" />
                                            </a>
                                          ))}
                                        </div>
                                      )}

                                      {(item.professionals || item.type === 'system') && (
                                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                              <User className="h-3 w-3 text-slate-400" />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                              {item.type === 'system' ? 'System Automator' : `${t.by_label} ${item.professionals.full_name}`}
                                            </p>
                                          </div>
                                          {item.type === 'appointment' && (
                                            <div className="flex items-center gap-1 text-[9px] font-black text-primary-600 uppercase tracking-[0.2em]">
                                              <Activity className="h-3 w-3" />
                                              Active Record
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'files' && (
                <motion.div key="files"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-8">

                  {/* SEARCH & FILTERS */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        placeholder={t.search_files || "Search documents..."}
                        value={fileSearch}
                        onChange={(e) => setFileSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 py-3.5 pl-12 pr-4 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none shadow-sm"
                      />
                    </div>
                    <div className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      {[
                        { id: 'all', label: t.all || 'Todos', icon: LayoutGrid },
                        { id: 'study', label: t.studies || 'Estudios', icon: FileSearch },
                      ].map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setFileFilter(filter.id as any)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            fileFilter === filter.id 
                              ? 'bg-slate-900 text-white shadow-md' 
                              : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                          }`}
                        >
                          <filter.icon className="h-3.5 w-3.5" />
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* UPLOADER ZONE */}
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] overflow-hidden hover:border-primary/40 hover:bg-primary/[0.01] transition-all group">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload}
                    />
                    <div className="p-10 flex flex-col items-center justify-center text-center">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <div className="h-20 w-20 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all mb-6 relative shadow-inner">
                          {isUploading ? (
                             <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
                          ) : (
                            <Upload className="h-8 w-8 group-hover:scale-110 transition-transform" />
                          )}
                          {!isUploading && (
                             <div className="absolute -top-2 -right-2 h-7 w-7 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg animate-bounce">
                              <Plus className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <h4 className="text-base font-black text-slate-900 tracking-tight mb-2">{t.upload_files_title || "Upload Clinical Assets"}</h4>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t.upload_files_desc || "PDF, Images or Documents up to 10MB"}</p>
                      </div>
                    </div>
                    
                    {uploadProgress && (
                      <div className="px-10 pb-8">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            className={`h-full ${uploadProgress.startsWith('✓') ? 'bg-emerald-500' : 'bg-primary-500'}`}
                          />
                        </div>
                        <p className={`mt-4 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 ${
                          uploadProgress.startsWith('✓') ? 'text-emerald-600' : 'text-primary-600'
                        }`}>
                          {uploadProgress.startsWith('✓') ? <CheckCircle2 className="h-4 w-4" /> : <Activity className="h-4 w-4 animate-pulse" />}
                          {uploadProgress}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* FILE GRID */}
                  {(() => {
                    const allFiles = history.flatMap(h => (h.attachments || []).map(file => ({
                      ...file,
                      recordId: h.id,
                      date: h.date,
                      professional: h.professionals?.full_name || 'System',
                      type: h.type // 'study', 'note', etc.
                    }))).filter(f => {
                      const matchesSearch = f.name.toLowerCase().includes(fileSearch.toLowerCase());
                      const matchesFilter = fileFilter === 'all' || 
                                          (fileFilter === 'study' && f.type === 'study');
                      return matchesSearch && matchesFilter;
                    });

                    if (allFiles.length === 0 && !isUploading) {
                      return (
                        <div className="py-24 text-center">
                          <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                            <FolderOpen className="h-10 w-10 text-slate-300" />
                          </div>
                          <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">{t.no_results_files || "No clinical files found"}</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allFiles.map((file, idx) => {
                          const isPDF = file.name.toLowerCase().endsWith('.pdf');
                          const isImage = /\.(jpg|jpeg|png|webp)$/i.test(file.name);

                          return (
                            <motion.div
                              key={`${file.recordId}-${idx}`}
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="group/card bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                            >
                              <div className="aspect-[4/3] bg-slate-50 relative flex items-center justify-center border-b border-slate-100 overflow-hidden">
                                {isImage ? (
                                  <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700" />
                                ) : (
                                  <div className={`h-20 w-20 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                                    isPDF ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'
                                  }`}>
                                    {isPDF ? <FileText className="h-10 w-10" /> : <File className="h-10 w-10" />}
                                  </div>
                                )}
                                
                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                  <a href={file.url} target="_blank" rel="noreferrer" className="p-3.5 bg-white text-slate-900 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-xl hover:scale-110">
                                    <Eye className="h-5 w-5" />
                                  </a>
                                  <a href={file.url} download={file.name} className="p-3.5 bg-white text-slate-900 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-xl hover:scale-110">
                                    <Download className="h-5 w-5" />
                                  </a>
                                </div>
                              </div>
                              
                              <div className="p-5">
                                <div className="flex items-start justify-between gap-3 mb-4">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                      {isPDF ? 'Adobe PDF Document' : (isImage ? 'Digital Image' : 'Clinical Asset')}
                                    </p>
                                  </div>
                                  <button 
                                    onClick={() => handleDeleteFile(file.recordId, file.url)}
                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                  <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200">
                                      <User className="h-3.5 w-3.5 text-slate-400" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[120px]">
                                      {file.professional}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <p className="text-[9px] font-black text-slate-900 uppercase">
                                      {format(new Date(file.date), 'dd MMM')}
                                    </p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                      {format(new Date(file.date), 'yyyy')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })()}
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
