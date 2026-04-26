"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Search, Phone, Calendar, Loader2, ChevronRight, X, ChevronLeft, Edit2, Upload, FileText, Download, Stethoscope, Paperclip, Plus, ArrowLeft } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { dateLocales } from '@/lib/i18n'
import { useLandingTranslation } from '@/components/LanguageContext'

interface MedicalEntry { id: string; date: string; content: string }
interface MedicalNotes { summary: string; logs: MedicalEntry[] }
interface Client { id: string; first_name: string; last_name: string; phone: string; notes: string | null; created_at: string }

export default function DoctorPatientsPage() {
  const { fullT, language } = useLandingTranslation()
  const lang = language as 'en' | 'es' | 'it'
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [profId, setProfId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientApps, setClientApps] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'perfil' | 'historia'>('perfil')
  const [clinicalRecords, setClinicalRecords] = useState<any[]>([])
  const [newRecordText, setNewRecordText] = useState('')
  const [isSavingRecord, setIsSavingRecord] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ notes: '' })
  const [editingAppId, setEditingAppId] = useState<string | null>(null)
  const [appNoteEdit, setAppNoteEdit] = useState('')
  const [isSavingAppNote, setIsSavingAppNote] = useState(false)

  const t = {
    back: lang === 'es' ? 'Volver' : 'Back',
    patients: lang === 'es' ? 'Tus pacientes asignados' : 'Your assigned patients',
    noPatients: lang === 'es' ? 'Aún no tienes pacientes asignados' : 'No patients assigned yet',
    noResults: lang === 'es' ? 'No se encontraron resultados' : 'No results found',
    profile: lang === 'es' ? 'Perfil' : 'Profile',
    history: lang === 'es' ? 'Historia Clínica' : 'Clinical History',
    observations: lang === 'es' ? 'OBSERVACIONES GENERALES' : 'GENERAL OBSERVATIONS',
    consultations: lang === 'es' ? 'Historial de consultas' : 'Consultation history',
    saveObs: lang === 'es' ? 'Guardar Observaciones' : 'Save Observations',
    addRecord: lang === 'es' ? 'Nuevo registro clínico...' : 'New clinical record...',
    save: lang === 'es' ? 'Guardar' : 'Save',
    cancel: lang === 'es' ? 'Cancelar' : 'Cancel',
    attachFile: lang === 'es' ? 'Adjuntar archivo' : 'Attach file',
    noRecords: lang === 'es' ? 'Sin registros clínicos' : 'No clinical records',
    saveNote: lang === 'es' ? 'Guardar Nota' : 'Save Note',
    medRecord: lang === 'es' ? 'REGISTRO MÉDICO' : 'MEDICAL RECORD',
    noObs: lang === 'es' ? 'Sin observaciones previas' : 'No previous observations',
    noConsults: lang === 'es' ? 'No hay registros' : 'No records',
    writeNote: lang === 'es' ? 'Escribe tus notas de la consulta...' : 'Write consultation notes...',
    writeObs: lang === 'es' ? 'Escribe aquí la historia clínica general...' : 'Write general medical history here...',
    writeRecord: lang === 'es' ? 'Nuevo registro clínico, diagnóstico, observación...' : 'New clinical record, diagnosis, observation...',
    attachment: lang === 'es' ? 'Archivo adjunto' : 'Attachment',
    download: lang === 'es' ? 'Descargar' : 'Download',
    clinicalRecord: lang === 'es' ? 'REGISTRO CLÍNICO' : 'CLINICAL RECORD',
  }

  const parseMedicalNotes = (n: string | null): MedicalNotes => {
    if (!n) return { summary: '', logs: [] }
    try {
      const p = JSON.parse(n)
      if (p && typeof p === 'object' && !Array.isArray(p)) return { summary: p.summary || '', logs: p.logs || [] }
      return { summary: n, logs: [] }
    } catch { return { summary: n, logs: [] } }
  }

  const parseAppEntries = (n: string | null): MedicalEntry[] => {
    if (!n) return []
    try {
      const p = JSON.parse(n)
      if (Array.isArray(p)) return p
      return [{ id: 'legacy', date: new Date().toISOString(), content: n }]
    } catch { return [{ id: 'legacy', date: new Date().toISOString(), content: n }] }
  }

  const fetchDoctorPatients = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: prof } = await supabase.from('professionals').select('id, tenant_id').eq('user_id', user.id).single()
    if (prof) {
      setProfId(prof.id)
      setTenantId(prof.tenant_id)
      const { data: appClients } = await supabase
        .from('appointments')
        .select('client_id, clients(id, first_name, last_name, phone, notes, created_at)')
        .eq('professional_id', prof.id)
        .order('created_at', { ascending: false })
      if (appClients) {
        const seen = new Set()
        const unique: Client[] = []
        appClients.forEach((ac: any) => { if (ac.clients && !seen.has(ac.clients.id)) { seen.add(ac.clients.id); unique.push(ac.clients) } })
        setClients(unique)
        setFilteredClients(unique)
      }
    }
    setLoading(false)
  }, [supabase])

  const fetchClinicalRecords = useCallback(async (clientId: string) => {
    if (!tenantId) return
    const res = await fetch(`/api/clinical-records?tenant_id=${tenantId}&client_id=${clientId}`)
    if (res.ok) setClinicalRecords(await res.json())
  }, [tenantId])

  useEffect(() => { fetchDoctorPatients() }, [fetchDoctorPatients])

  useEffect(() => {
    if (!searchTerm.trim()) { setFilteredClients(clients) } else {
      const term = searchTerm.toLowerCase()
      setFilteredClients(clients.filter(c => c.first_name.toLowerCase().includes(term) || c.last_name.toLowerCase().includes(term) || c.phone.includes(term)))
    }
  }, [searchTerm, clients])

  async function openClientDetail(client: Client) {
    setSelectedClient(client)
    setIsEditing(false)
    setEditingAppId(null)
    setActiveTab('perfil')
    setEditData({ notes: parseMedicalNotes(client.notes).summary })
    const { data } = await supabase.from('appointments').select('id, status, start_at, notes, services(name)').eq('client_id', client.id).eq('professional_id', profId).order('start_at', { ascending: false })
    setClientApps(data || [])
    fetchClinicalRecords(client.id)
  }

  async function handleAddAppPost(appId: string) {
    if (!appNoteEdit.trim()) return
    setIsSavingAppNote(true)
    const app = clientApps.find(a => a.id === appId)
    const updated = [...parseAppEntries(app?.notes || null), { id: crypto.randomUUID(), date: new Date().toISOString(), content: appNoteEdit.trim() }]
    const updatedStr = JSON.stringify(updated)
    const res = await fetch('/api/appointments', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: appId, tenant_id: tenantId, notes: updatedStr }) })
    if (res.ok) { setClientApps(clientApps.map(a => a.id === appId ? { ...a, notes: updatedStr } : a)); setAppNoteEdit('') }
    setIsSavingAppNote(false)
  }

  async function handleSaveObs() {
    if (!selectedClient) return
    const current = parseMedicalNotes(selectedClient.notes)
    const updatedNotes = JSON.stringify({ ...current, summary: editData.notes })
    const res = await fetch('/api/clients', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedClient.id, tenant_id: tenantId, data: { notes: updatedNotes } }) })
    if (res.ok) { setSelectedClient({ ...selectedClient, notes: updatedNotes }); setIsEditing(false) }
  }

  async function handleSaveClinicalRecord() {
    if (!selectedClient || !newRecordText.trim()) return
    setIsSavingRecord(true)
    const res = await fetch('/api/clinical-records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenant_id: tenantId, client_id: selectedClient.id, content: newRecordText }) })
    if (res.ok) { setNewRecordText(''); fetchClinicalRecords(selectedClient.id) }
    setIsSavingRecord(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedClient || !e.target.files?.length) return
    const file = e.target.files[0]
    if (file.size > 5 * 1024 * 1024) { alert('Máx 5MB'); return }
    setUploadingFiles(true)
    const fileName = `${tenantId}/${selectedClient.id}/${crypto.randomUUID()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('clinical_files').upload(fileName, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('clinical_files').getPublicUrl(fileName)
      await fetch('/api/clinical-records', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          tenant_id: tenantId, 
          client_id: selectedClient.id, 
          content: newRecordText.trim() || `Archivo adjunto: ${file.name}`, 
          attachments: [{ name: file.name, url: publicUrl }] 
        }) 
      })
      setNewRecordText('')
      fetchClinicalRecords(selectedClient.id)
    }
    setUploadingFiles(false)
  }

  const dateLocale = (dateLocales as any)[language]

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 text-amber-500 animate-spin" /></div>

  const statusLabel = (s: string) => ({ confirmed: lang === 'es' ? 'Confirmado' : 'Confirmed', completed: lang === 'es' ? 'Completado' : 'Completed', cancelled: lang === 'es' ? 'Cancelado' : 'Cancelled' }[s] || (lang === 'es' ? 'Pendiente' : 'Pending'))
  const statusColor = (s: string) => s === 'confirmed' || s === 'completed' ? 'bg-emerald-50 text-emerald-600' : s === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'

  return (
    <>
      <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{fullT.nav_patients}</h1>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{t.patients}</p>
          </div>
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={fullT.search_patients_placeholder} className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm" />
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-20 text-center">
            <Users className="h-16 w-16 text-slate-100 mx-auto mb-6" />
            <h3 className="text-xl font-black text-slate-300">{searchTerm ? t.noResults : t.noPatients}</h3>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredClients.map(client => (
              <button key={client.id} onClick={() => openClientDetail(client)} className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group text-left">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xl border border-slate-100 group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-100 transition-colors">
                    {client.first_name[0]}{client.last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">{client.first_name} {client.last_name}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-1"><Phone className="h-3.5 w-3.5" /> {client.phone}</div>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-amber-500 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedClient && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="bg-slate-900 px-6 py-4 text-white shadow-lg sticky top-0 z-10">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedClient(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center gap-2 text-sm font-bold">
                  <ChevronLeft className="h-5 w-5" /> {t.back}
                </button>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-black">{selectedClient.first_name[0]}{selectedClient.last_name?.[0]}</div>
                  <div>
                    <h3 className="text-lg font-black leading-none">{selectedClient.first_name} {selectedClient.last_name}</h3>
                    <p className="text-slate-400 text-xs mt-1 font-bold">{selectedClient.phone}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X className="h-6 w-6 opacity-60" /></button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white border-b border-slate-100 sticky top-[72px] z-10">
            <div className="max-w-7xl mx-auto px-6 flex gap-1 pt-2">
              {(['perfil', 'historia'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 text-sm font-black rounded-t-xl transition-all ${activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                  {tab === 'perfil' ? <><Calendar className="h-4 w-4 inline mr-2" />{t.profile}</> : <><Stethoscope className="h-4 w-4 inline mr-2" />{t.history}</>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">

              {/* PERFIL TAB */}
              {activeTab === 'perfil' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Observaciones */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users className="h-4 w-4" />{t.observations}</h4>
                        <button onClick={() => setIsEditing(!isEditing)} className="p-2 hover:bg-slate-50 rounded-xl text-amber-500 transition-all">
                          {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                        </button>
                      </div>
                      {isEditing ? (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                          <textarea value={editData.notes} onChange={e => setEditData({ notes: e.target.value })} className="w-full bg-slate-50 rounded-2xl p-5 text-sm font-medium text-slate-600 min-h-[150px] leading-relaxed border-none focus:ring-2 focus:ring-amber-500 outline-none" placeholder={t.writeObs} />
                          <button onClick={handleSaveObs} className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">{t.saveObs}</button>
                        </div>
                      ) : (
                        <div className="bg-slate-50 rounded-2xl p-5 text-sm font-medium text-slate-600 min-h-[120px] leading-relaxed">
                          {parseMedicalNotes(selectedClient.notes).summary || t.noObs}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Historial de citas */}
                  <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[50vh]">
                      <h4 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-amber-500" />{t.consultations} ({clientApps.length})
                      </h4>
                      {clientApps.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-300 font-bold">{t.noConsults}</div>
                      ) : (
                        <div className="space-y-6">
                          {clientApps.map(app => (
                            <div key={app.id} className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <p className="text-md font-black text-slate-900">{app.services?.name || 'Consulta General'}</p>
                                  <p className="text-xs font-bold text-slate-400 mt-1">{format(parseISO(app.start_at), "d MMMM yyyy · HH:mm'h'", { locale: dateLocale })}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${statusColor(app.status)}`}>{statusLabel(app.status)}</span>
                              </div>
                              <div className="space-y-3">
                                {parseAppEntries(app.notes).map(entry => (
                                  <div key={entry.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{t.medRecord}</span>
                                      <span className="text-[10px] text-slate-300 font-bold">{format(parseISO(entry.date), "HH:mm'h'", { locale: dateLocale })}</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed">{entry.content}</p>
                                  </div>
                                ))}
                                <div className="bg-white/50 rounded-2xl p-4 border border-dashed border-slate-200">
                                  <textarea value={editingAppId === app.id ? appNoteEdit : ''} onFocus={() => setEditingAppId(app.id)} onChange={e => setAppNoteEdit(e.target.value)} placeholder={t.writeNote} className="w-full bg-transparent text-sm font-medium border-none focus:ring-0 resize-none placeholder-slate-300 min-h-[40px]" rows={editingAppId === app.id ? 3 : 1} />
                                  {editingAppId === app.id && (
                                    <div className="flex justify-end mt-2 gap-2">
                                      <button onClick={() => handleAddAppPost(app.id)} disabled={isSavingAppNote || !appNoteEdit.trim()} className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-xs font-black disabled:opacity-50">{isSavingAppNote ? '...' : t.saveNote}</button>
                                      <button onClick={() => setEditingAppId(null)} className="text-slate-400 text-xs font-black px-3">{t.cancel}</button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* HISTORIA CLÍNICA TAB */}
              {activeTab === 'historia' && (
                <div className="space-y-6">
                  {/* Nuevo registro */}
                  <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Plus className="h-4 w-4" />{lang === 'es' ? 'Nuevo Registro' : 'New Record'}</h4>
                    <textarea value={newRecordText} onChange={e => setNewRecordText(e.target.value)} placeholder={t.writeRecord} className="w-full bg-slate-50 rounded-2xl p-5 text-sm font-medium text-slate-600 min-h-[120px] border-none focus:ring-2 focus:ring-amber-500 outline-none" />
                    <div className="flex items-center gap-3 mt-4">
                      <button onClick={handleSaveClinicalRecord} disabled={isSavingRecord || !newRecordText.trim()} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all flex items-center gap-2">
                        {isSavingRecord ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}{t.save}
                      </button>
                      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileUpload} />
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFiles} className="border border-slate-200 text-slate-500 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50 active:scale-95 transition-all flex items-center gap-2">
                        {uploadingFiles ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}{t.attachFile}
                      </button>
                    </div>
                  </div>

                  {/* Registros existentes */}
                  {clinicalRecords.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-300 font-bold">{t.noRecords}</div>
                  ) : (
                    <div className="space-y-4">
                      {clinicalRecords.map((record: any) => (
                        <div key={record.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                          <div className="flex items-center gap-2 mb-3">
                            <Stethoscope className="h-4 w-4 text-indigo-500" />
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{t.clinicalRecord}</span>
                            <span className="text-[10px] text-slate-300 font-bold">{format(parseISO(record.created_at), "d MMM yyyy · HH:mm'h'", { locale: dateLocale })}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-600 leading-relaxed">{record.content}</p>
                          {record.attachments?.length > 0 && (
                            <div className="mt-4 space-y-2">
                              {record.attachments.map((att: any, i: number) => (
                                <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-100 transition-colors w-fit">
                                  <Download className="h-3.5 w-3.5" />{att.name}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  )
}
