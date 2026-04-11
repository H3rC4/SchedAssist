"use client"

import { useEffect, useState } from 'react'
import { Clock, Save, X, Users, ChevronRight, CheckCircle, Trash2, UserPlus, Coffee, CalendarX, CalendarPlus, AlertTriangle, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AvailabilityRule {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
  lunch_break_start?: string | null;
  lunch_break_end?: string | null;
}

interface Professional {
  id: string; full_name: string; specialty: string | null; active: boolean;
  availability_rules: AvailabilityRule[];
}

const i18n = {
  es: {
    title: 'Staff de Profesionales', subtitle: 'Gestiona los doctores y sus horarios de atención disponibles.',
    addBtn: 'Agregar Profesional', noProf: 'No hay profesionales registrados aún.',
    specialtyGen: 'General', workDays: 'días laborales', newProf: 'Nuevo Profesional',
    fullName: 'Nombre Completo', fullNamePH: 'Ej: Dra. Elena Nito',
    specialty: 'Especialidad', specialtyPH: 'Ej: Cardiología',
    saving: 'Guardando...', createBtn: 'Crear Profesional',
    delConfirm: '¿Seguro que deseas eliminar a este profesional? Se borrarán sus horarios asociados.',
    schedule: 'Horarios', patientHistory: 'Historial de pacientes',
    noPatients: 'Sin pacientes registrados.', saved: '¡Horarios Guardados!',
    processing: 'Procesando...', confirmSave: 'Confirmar Cambios',
    lunchBreak: 'Pausa para comer', lunchFrom: 'Desde', lunchTo: 'Hasta',
    created: '¡Creado!', done: '¡Hecho!',
    days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  },
  it: {
    title: 'Staff Professionisti', subtitle: 'Gestisci i medici e i loro orari di ricevimento disponibili.',
    addBtn: 'Aggiungi Professionista', noProf: 'Nessun professionista registrato.',
    specialtyGen: 'Generale', workDays: 'giorni lavorativi', newProf: 'Nuovo Professionista',
    fullName: 'Nome Completo', fullNamePH: 'Es: Dott. Mario Rossi',
    specialty: 'Specialità', specialtyPH: 'Es: Cardiologia',
    saving: 'Salvataggio...', createBtn: 'Crea Professionista',
    delConfirm: 'Sei sicuro di voler eliminare questo professionista? Tutti gli orari associati verranno rimossi.',
    schedule: 'Orari', patientHistory: 'Cronologia Pazienti',
    noPatients: 'Nessun paziente registrato.', saved: 'Orari Salvati!',
    processing: 'Elaborazione...', confirmSave: 'Conferma Modifiche',
    lunchBreak: 'Pausa pranzo', lunchFrom: 'Dalle', lunchTo: 'Alle',
    created: 'Creato!', done: 'Fatto!',
    days: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
  },
  en: {
    title: 'Professional Staff', subtitle: 'Manage doctors and their available office hours.',
    addBtn: 'Add Professional', noProf: 'No professionals registered yet.',
    specialtyGen: 'General', workDays: 'work days', newProf: 'New Professional',
    fullName: 'Full Name', fullNamePH: 'Ex: Dr. John Smith',
    specialty: 'Specialty', specialtyPH: 'Ex: Cardiology',
    saving: 'Saving...', createBtn: 'Create Professional',
    delConfirm: 'Are you sure you want to delete this professional? All associated schedules will be removed.',
    schedule: 'Schedule', patientHistory: 'Patient History',
    noPatients: 'No patients registered.', saved: 'Schedule Saved!',
    processing: 'Processing...', confirmSave: 'Confirm Changes',
    lunchBreak: 'Lunch break', lunchFrom: 'From', lunchTo: 'To',
    created: 'Created!', done: 'Done!',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  }
}

interface Override {
  id: string;
  override_date: string;
  override_type: 'block' | 'open';
  start_time: string | null;
  end_time: string | null;
  note: string | null;
}

export default function ProfessionalsPage() {
  const supabase = createClient()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [tenantId, setTenantId] = useState('')
  const [selectedProf, setSelectedProf] = useState<Professional | null>(null)
  const [profClients, setProfClients] = useState<any[]>([])
  const [editRules, setEditRules] = useState<AvailabilityRule[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProfData, setNewProfData] = useState({ full_name: '', specialty: '' })
  const [lang, setLang] = useState<'en' | 'es' | 'it'>('es')
  
  const [activeTab, setActiveTab] = useState<'schedule' | 'exceptions'>('schedule')
  const [overrides, setOverrides] = useState<Override[]>([])
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [overrideModal, setOverrideModal] = useState<{ date: string; existingOverride?: Override } | null>(null)
  const [overrideForm, setOverrideForm] = useState({ type: 'block', start_time: '09:00', end_time: '18:00', note: '' })
  const [overrideConflicts, setOverrideConflicts] = useState<any[]>([])
  const [savingOverride, setSavingOverride] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)
  const [overrideSuccess, setOverrideSuccess] = useState(false)

  useEffect(() => { initTenant() }, [])
  useEffect(() => { if (tenantId) fetchProfessionals() }, [tenantId])

  async function initTenant() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: tuData } = await supabase
      .from('tenant_users')
      .select('tenant_id, tenants(id, settings)')
      .eq('user_id', user.id)
      .limit(1).single()
    if (tuData?.tenants) {
      const tenant = tuData.tenants as any
      setTenantId(tenant.id)
      setLang((tenant.settings?.language as 'en' | 'es' | 'it') || 'es')
    }
  }

  async function fetchProfessionals() {
    const { data } = await supabase
      .from('professionals')
      .select(`*, availability_rules(*)`)
      .eq('tenant_id', tenantId)
      .order('full_name')
    if (data) setProfessionals(data as Professional[])
  }

  async function openProfDetail(prof: Professional) {
    setSelectedProf(prof)
    setSaved(false)
    setActiveTab('schedule')
    setOverrides([])
    const rules: AvailabilityRule[] = []
    const existingRules = prof.availability_rules || []
    for (let d = 0; d < 7; d++) {
      const existing = existingRules.find(r => r.day_of_week === d)
      rules.push(existing ? { ...existing } : {
        day_of_week: d, start_time: '09:00:00', end_time: '18:00:00',
        active: false, lunch_break_start: null, lunch_break_end: null
      })
    }
    setEditRules(rules)
    const { data: apps } = await supabase
      .from('appointments')
      .select(`clients(id, first_name, last_name, phone)`)
      .eq('professional_id', prof.id)
      .neq('status', 'cancelled')
    const seen = new Set<string>()
    const uniqueClients: any[] = []
    for (const app of (apps || [])) {
      if (app.clients && !seen.has((app.clients as any).id)) {
        seen.add((app.clients as any).id)
        uniqueClients.push(app.clients)
      }
    }
    setProfClients(uniqueClients)
    await loadOverrides(prof.id)
  }

  async function loadOverrides(profId: string) {
    const from = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).toISOString().split('T')[0]
    const to = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 2, 0).toISOString().split('T')[0]
    const res = await fetch(`/api/professionals/overrides?professional_id=${profId}&tenant_id=${tenantId}&from=${from}&to=${to}`)
    if (res.ok) setOverrides(await res.json())
  }

  function openOverrideModal(dateStr: string) {
    const existing = overrides.find(o => o.override_date === dateStr)
    setOverrideConflicts([])
    setOverrideForm(existing?.override_type === 'open'
      ? { type: 'open', start_time: existing.start_time?.slice(0,5) || '09:00', end_time: existing.end_time?.slice(0,5) || '18:00', note: existing.note || '' }
      : { type: existing?.override_type || 'block', start_time: '09:00', end_time: '18:00', note: existing?.note || '' }
    )
    setOverrideModal({ date: dateStr, existingOverride: existing })
  }

  async function saveOverride() {
    if (!selectedProf || !overrideModal) return
    setSavingOverride(true)
    const res = await fetch('/api/professionals/overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenantId,
        professional_id: selectedProf.id,
        override_date: overrideModal.date,
        override_type: overrideForm.type,
        start_time: overrideForm.type === 'open' ? overrideForm.start_time + ':00' : null,
        end_time:   overrideForm.type === 'open' ? overrideForm.end_time   + ':00' : null,
        note: overrideForm.note || null,
      })
    })
    const data = await res.json()
    setSavingOverride(false)
    if (data.conflicts_found > 0) {
      setOverrideConflicts(data.conflicts)
    } else {
      setOverrideSuccess(true)
      await loadOverrides(selectedProf.id)
      setTimeout(() => {
        setOverrideModal(null)
        setOverrideSuccess(false)
      }, 800)
    }
  }

  async function deleteOverride(id: string) {
    if (!selectedProf) return
    await fetch(`/api/professionals/overrides?id=${id}&tenant_id=${tenantId}`, { method: 'DELETE' })
    await loadOverrides(selectedProf.id)
  }

  function getCalendarDays(month: Date) {
    const year = month.getFullYear()
    const m = month.getMonth()
    const firstDay = new Date(year, m, 1).getDay()
    const daysInMonth = new Date(year, m + 1, 0).getDate()
    const days: (number | null)[] = Array(firstDay).fill(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }

  function formatDateStr(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  async function saveRules() {
    if (!selectedProf) return
    setSaving(true)
    const res = await fetch('/api/professionals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professional_id: selectedProf.id, tenant_id: tenantId, rules: editRules })
    })
    if (res.ok) {
      setSaved(true)
      fetchProfessionals()
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  async function handleAddProfessional() {
    if (!newProfData.full_name) return
    setSaving(true)
    const res = await fetch('/api/professionals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, ...newProfData })
    })
    if (res.ok) {
      setAddSuccess(true)
      fetchProfessionals()
      setTimeout(() => {
        setShowAddForm(false)
        setAddSuccess(false)
        setNewProfData({ full_name: '', specialty: '' })
      }, 800)
    }
    setSaving(false)
  }

  async function handleDeleteProfessional(id: string) {
    const T_ui = i18n[lang] || i18n['en']
    if (!confirm(T_ui.delConfirm)) return
    const res = await fetch(`/api/professionals?id=${id}&tenant_id=${tenantId}`, { method: 'DELETE' })
    if (res.ok) { setSelectedProf(null); fetchProfessionals() }
  }

  function updateRule(dayIndex: number, field: string, value: any) {
    setEditRules(prev => prev.map(r => r.day_of_week === dayIndex ? { ...r, [field]: value } : r))
  }

  function toggleLunchBreak(dayIndex: number, enabled: boolean) {
    setEditRules(prev => prev.map(r => r.day_of_week === dayIndex ? {
      ...r,
      lunch_break_start: enabled ? '13:00:00' : null,
      lunch_break_end: enabled ? '14:00:00' : null,
    } : r))
  }

  const T_ui = i18n[lang] || i18n['en']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{T_ui.title}</h1>
          <p className="text-sm text-gray-500">{T_ui.subtitle}</p>
        </div>
        <button onClick={() => setShowAddForm(true)}
          className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-colors">
          <UserPlus className="-ml-1 mr-2 h-5 w-5" /> {T_ui.addBtn}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {professionals.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Users className="mx-auto h-12 w-12 mb-3 opacity-20" />
            <p>{T_ui.noProf}</p>
          </div>
        ) : professionals.map(prof => (
          <button key={prof.id} onClick={() => openProfDetail(prof)}
            className="text-left bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all group relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${prof.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            <div className="flex items-center gap-4 mb-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-200">
                {prof.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-gray-900 truncate">{prof.full_name}</p>
                <p className="text-xs text-primary-600 font-medium uppercase tracking-wider">{prof.specialty || T_ui.specialtyGen}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">
                  {(prof.availability_rules || []).filter(r => r.active).length} {T_ui.workDays}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
            </div>
          </button>
        ))}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md" onClick={() => setShowAddForm(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900">{T_ui.newProf}</h3>
                <button onClick={() => setShowAddForm(false)} className="p-2 rounded-full hover:bg-gray-100">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{T_ui.fullName}</label>
                  <input autoFocus value={newProfData.full_name} onChange={e => setNewProfData({ ...newProfData, full_name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder={T_ui.fullNamePH} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{T_ui.specialty}</label>
                  <input value={newProfData.specialty} onChange={e => setNewProfData({ ...newProfData, specialty: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder={T_ui.specialtyPH} />
                </div>
                <button onClick={handleAddProfessional} disabled={saving || addSuccess || !newProfData.full_name}
                  className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2
                    ${addSuccess ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-primary-600 text-white shadow-primary-200 hover:bg-primary-700'}`}>
                  {addSuccess ? (
                    <><CheckCircle className="h-5 w-5" /> {T_ui.created}</>
                  ) : saving ? T_ui.saving : T_ui.createBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md" onClick={() => setSelectedProf(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary-200">
                  {selectedProf.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedProf.full_name}</h3>
                  <p className="text-primary-600 font-semibold text-sm">{selectedProf.specialty || T_ui.specialtyGen}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProf(null)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="flex border-b border-gray-100 px-8">
              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === 'schedule' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Clock className="h-4 w-4" /> {T_ui.schedule}
              </button>
              <button
                onClick={() => setActiveTab('exceptions')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === 'exceptions' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <CalendarX className="h-4 w-4" />
                {lang === 'es' ? 'Excepciones' : lang === 'it' ? 'Eccezioni' : 'Exceptions'}
                {overrides.length > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">{overrides.length}</span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {activeTab === 'exceptions' ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} className="p-2 rounded-xl hover:bg-gray-100">
                      <ChevronLeft className="h-4 w-4 text-gray-500" />
                    </button>
                    <span className="font-bold text-gray-700 text-sm">
                      {calendarMonth.toLocaleDateString(lang === 'it' ? 'it-IT' : lang === 'en' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} className="p-2 rounded-xl hover:bg-gray-100">
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {(lang === 'es' ? ['Do','Lu','Ma','Mi','Ju','Vi','Sa'] : lang === 'it' ? ['Do','Lu','Ma','Me','Gi','Ve','Sa'] : ['Su','Mo','Tu','We','Th','Fr','Sa']).map(d => (
                      <div key={d} className="text-[10px] font-black text-gray-400 uppercase py-1">{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {getCalendarDays(calendarMonth).map((day, i) => {
                      if (!day) return <div key={i} />
                      const dateStr = formatDateStr(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
                      const override = overrides.find(o => o.override_date === dateStr)
                      const isBlocked = override?.override_type === 'block'
                      const isOpen    = override?.override_type === 'open'
                      const isPast    = new Date(dateStr) < new Date(new Date().toDateString())
                      return (
                        <button
                          key={i}
                          onClick={() => !isPast && selectedProf && openOverrideModal(dateStr)}
                          className={`relative h-10 w-full rounded-xl text-sm font-bold transition-all ${
                            isPast ? 'opacity-30 cursor-default' :
                            isBlocked ? 'bg-red-100 text-red-600 border-2 border-red-300 hover:bg-red-200' :
                            isOpen   ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300 hover:bg-emerald-200' :
                            'hover:bg-primary-50 hover:text-primary-600 text-gray-700'
                          }`}
                        >
                          {day}
                          {isBlocked && <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-red-400" />}
                          {isOpen    && <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex gap-4 text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-300" />{lang === 'es' ? 'Bloqueado' : lang === 'it' ? 'Bloccato' : 'Blocked'}</span>
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-300" />{lang === 'es' ? 'Horario especial' : lang === 'it' ? 'Orario speciale' : 'Special hours'}</span>
                  </div>

                  {overrides.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        {lang === 'es' ? 'Excepciones activas' : lang === 'it' ? 'Eccezioni attive' : 'Active exceptions'}
                      </h5>
                      {overrides.map(ov => (
                        <div key={ov.id} className={`flex items-center justify-between p-3 rounded-xl border text-sm ${
                          ov.override_type === 'block' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        }`}>
                          <div className="flex items-center gap-2">
                            {ov.override_type === 'block' ? <CalendarX className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}
                            <span className="font-bold">{ov.override_date}</span>
                            {ov.override_type === 'open' && <span className="text-xs opacity-70">{ov.start_time?.slice(0,5)}–{ov.end_time?.slice(0,5)}</span>}
                            {ov.note && <span className="text-xs opacity-60 italic">· {ov.note}</span>}
                          </div>
                          <button onClick={() => deleteOverride(ov.id)} className="p-1 rounded-lg hover:bg-white/60"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="h-4 w-4" /> {T_ui.schedule}
                    </h4>
                    <div className="grid gap-4">
                      {editRules.map((rule) => (
                        <div key={rule.day_of_week}
                          className={`rounded-2xl border transition-all ${rule.active ? 'border-primary-100 bg-primary-50/20' : 'border-gray-50 bg-gray-50/30 opacity-60'}`}>
                          <div className="flex items-center gap-4 p-4">
                            <label className="flex items-center gap-3 cursor-pointer min-w-[140px]">
                              <input type="checkbox" checked={rule.active}
                                onChange={e => updateRule(rule.day_of_week, 'active', e.target.checked)}
                                className="w-5 h-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500" />
                              <span className={`text-sm font-bold ${rule.active ? 'text-gray-900' : 'text-gray-400'}`}>
                                {T_ui.days[rule.day_of_week]}
                              </span>
                            </label>
                            {rule.active && (
                              <div className="flex items-center gap-3 ml-auto animate-in fade-in slide-in-from-right-2 duration-300">
                                <input type="time" value={rule.start_time.slice(0, 5)}
                                  onChange={e => updateRule(rule.day_of_week, 'start_time', e.target.value + ':00')}
                                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none" />
                                <span className="text-gray-300 font-bold">→</span>
                                <input type="time" value={rule.end_time.slice(0, 5)}
                                  onChange={e => updateRule(rule.day_of_week, 'end_time', e.target.value + ':00')}
                                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none" />
                              </div>
                            )}
                          </div>

                          {rule.active && (
                            <div className="px-4 pb-4 animate-in fade-in duration-300">
                              <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                                <Coffee className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-amber-700 font-medium">
                                  <input
                                    type="checkbox"
                                    checked={!!rule.lunch_break_start}
                                    onChange={e => toggleLunchBreak(rule.day_of_week, e.target.checked)}
                                    className="w-4 h-4 rounded-md border-amber-300 text-amber-500 focus:ring-amber-400"
                                  />
                                  {T_ui.lunchBreak}
                                </label>
                                {rule.lunch_break_start && (
                                  <div className="flex items-center gap-2 ml-auto animate-in fade-in slide-in-from-right-2 duration-300">
                                    <span className="text-xs text-amber-600">{T_ui.lunchFrom}</span>
                                    <input type="time" value={rule.lunch_break_start.slice(0, 5)}
                                      onChange={e => updateRule(rule.day_of_week, 'lunch_break_start', e.target.value + ':00')}
                                      className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-amber-400 outline-none bg-white" />
                                    <span className="text-xs text-amber-600">{T_ui.lunchTo}</span>
                                    <input type="time" value={(rule.lunch_break_end || '14:00').slice(0, 5)}
                                      onChange={e => updateRule(rule.day_of_week, 'lunch_break_end', e.target.value + ':00')}
                                      className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-amber-400 outline-none bg-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-3xl p-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4" /> {T_ui.patientHistory} ({profClients.length})
                    </h4>
                    {profClients.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">{T_ui.noPatients}</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {profClients.map((c: any) => (
                          <span key={c.id} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm">
                            {c.first_name} {c.last_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-8 pb-8 pt-4 flex gap-4">
              <button onClick={() => handleDeleteProfessional(selectedProf.id)}
                className="flex items-center justify-center p-4 rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="h-5 w-5" />
              </button>
              <button onClick={saveRules} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-xl shadow-primary-200 disabled:opacity-50 transition-all">
                {saved ? (
                  <><CheckCircle className="h-5 w-5" /> {T_ui.saved}</>
                ) : saving ? T_ui.processing : (
                  <><Save className="h-5 w-5" /> {T_ui.confirmSave}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {overrideModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md" onClick={() => setOverrideModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {lang === 'es' ? 'Excepción para' : lang === 'it' ? 'Eccezione per' : 'Exception for'} {overrideModal.date}
                </h3>
                <button onClick={() => setOverrideModal(null)} className="p-2 rounded-full hover:bg-gray-100"><X className="h-4 w-4" /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOverrideForm(f => ({ ...f, type: 'block' }))}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      overrideForm.type === 'block' ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <CalendarX className="h-4 w-4" />
                    {lang === 'es' ? 'Bloquear' : lang === 'it' ? 'Blocca' : 'Block'}
                  </button>
                  <button
                    onClick={() => setOverrideForm(f => ({ ...f, type: 'open' }))}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      overrideForm.type === 'open' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <CalendarPlus className="h-4 w-4" />
                    {lang === 'es' ? 'Horario especial' : lang === 'it' ? 'Orario speciale' : 'Special hours'}
                  </button>
                </div>

                {overrideForm.type === 'open' && (
                  <div className="flex items-center gap-3 animate-in fade-in duration-200">
                    <input type="time" value={overrideForm.start_time}
                      onChange={e => setOverrideForm(f => ({...f, start_time: e.target.value}))}
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none" />
                    <span className="text-gray-400 font-bold">→</span>
                    <input type="time" value={overrideForm.end_time}
                      onChange={e => setOverrideForm(f => ({...f, end_time: e.target.value}))}
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                )}

                <input type="text" value={overrideForm.note}
                  placeholder={lang === 'es' ? 'Nota (opcional)' : lang === 'it' ? 'Nota (opzionale)' : 'Note (optional)'}
                  onChange={e => setOverrideForm(f => ({...f, note: e.target.value}))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />

                {overrideConflicts.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-700">
                      <p className="font-black mb-1">
                        {lang === 'es' ? `⚠️ ${overrideConflicts.length} cita(s) afectada(s)` :
                         `⚠️ ${overrideConflicts.length} appointment(s) affected`}
                      </p>
                    </div>
                  </div>
                )}

                <button onClick={saveOverride} disabled={savingOverride || overrideSuccess}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                    overrideSuccess ? 'bg-emerald-500 text-white' :
                    overrideForm.type === 'block' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {overrideSuccess ? (
                    <><CheckCircle className="h-4 w-4" /> {T_ui.done}</>
                  ) : savingOverride ? '...' : (lang === 'es' ? 'Guardar excepción' : 'Save exception')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
