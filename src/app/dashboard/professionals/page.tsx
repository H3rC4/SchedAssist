"use client"

import { useEffect, useState } from 'react'
import { Clock, Save, X, Users, ChevronRight, CheckCircle, Trash2, UserPlus, Coffee } from 'lucide-react'
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
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  }
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
      setShowAddForm(false)
      setNewProfData({ full_name: '', specialty: '' })
      fetchProfessionals()
    }
    setSaving(false)
  }

  async function handleDeleteProfessional(id: string) {
    const T = i18n[lang] || i18n['en']
    if (!confirm(T.delConfirm)) return
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

  const T = i18n[lang] || i18n['en']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{T.title}</h1>
          <p className="text-sm text-gray-500">{T.subtitle}</p>
        </div>
        <button onClick={() => setShowAddForm(true)}
          className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-colors">
          <UserPlus className="-ml-1 mr-2 h-5 w-5" /> {T.addBtn}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {professionals.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Users className="mx-auto h-12 w-12 mb-3 opacity-20" />
            <p>{T.noProf}</p>
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
                <p className="text-xs text-primary-600 font-medium uppercase tracking-wider">{prof.specialty || T.specialtyGen}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">
                  {(prof.availability_rules || []).filter(r => r.active).length} {T.workDays}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
            </div>
          </button>
        ))}
      </div>

      {/* Add Professional Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md" onClick={() => setShowAddForm(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900">{T.newProf}</h3>
                <button onClick={() => setShowAddForm(false)} className="p-2 rounded-full hover:bg-gray-100">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{T.fullName}</label>
                  <input autoFocus value={newProfData.full_name} onChange={e => setNewProfData({ ...newProfData, full_name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder={T.fullNamePH} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{T.specialty}</label>
                  <input value={newProfData.specialty} onChange={e => setNewProfData({ ...newProfData, specialty: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder={T.specialtyPH} />
                </div>
                <button onClick={handleAddProfessional} disabled={saving || !newProfData.full_name}
                  className="w-full py-4 rounded-2xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all disabled:opacity-50 mt-4">
                  {saving ? T.saving : T.createBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Detail / Schedule Modal */}
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
                  <p className="text-primary-600 font-semibold text-sm">{selectedProf.specialty || T.specialtyGen}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProf(null)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Schedule */}
              <div>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> {T.schedule}
                </h4>
                <div className="grid gap-4">
                  {editRules.map((rule) => (
                    <div key={rule.day_of_week}
                      className={`rounded-2xl border transition-all ${rule.active ? 'border-primary-100 bg-primary-50/20' : 'border-gray-50 bg-gray-50/30 opacity-60'}`}>
                      {/* Row: day toggle + working hours */}
                      <div className="flex items-center gap-4 p-4">
                        <label className="flex items-center gap-3 cursor-pointer min-w-[140px]">
                          <input type="checkbox" checked={rule.active}
                            onChange={e => updateRule(rule.day_of_week, 'active', e.target.checked)}
                            className="w-5 h-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500" />
                          <span className={`text-sm font-bold ${rule.active ? 'text-gray-900' : 'text-gray-400'}`}>
                            {T.days[rule.day_of_week]}
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

                      {/* Lunch Break Row */}
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
                              {T.lunchBreak}
                            </label>
                            {rule.lunch_break_start && (
                              <div className="flex items-center gap-2 ml-auto animate-in fade-in slide-in-from-right-2 duration-300">
                                <span className="text-xs text-amber-600">{T.lunchFrom}</span>
                                <input type="time" value={rule.lunch_break_start.slice(0, 5)}
                                  onChange={e => updateRule(rule.day_of_week, 'lunch_break_start', e.target.value + ':00')}
                                  className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-amber-400 outline-none bg-white" />
                                <span className="text-xs text-amber-600">{T.lunchTo}</span>
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

              {/* Patient History */}
              <div className="bg-gray-50 rounded-3xl p-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" /> {T.patientHistory} ({profClients.length})
                </h4>
                {profClients.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">{T.noPatients}</p>
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

            <div className="px-8 pb-8 pt-4 flex gap-4">
              <button onClick={() => handleDeleteProfessional(selectedProf.id)}
                className="flex items-center justify-center p-4 rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="h-5 w-5" />
              </button>
              <button onClick={saveRules} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-xl shadow-primary-200 disabled:opacity-50 transition-all">
                {saved ? (
                  <><CheckCircle className="h-5 w-5" /> {T.saved}</>
                ) : saving ? T.processing : (
                  <><Save className="h-5 w-5" /> {T.confirmSave}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
