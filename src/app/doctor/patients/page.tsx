"use client"

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Search, Phone, Calendar, Loader2, ChevronRight, X, ChevronLeft, User } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { dateLocales } from '@/lib/i18n'
import { useLandingTranslation } from '@/components/LanguageContext'

interface Client {
  id: string; first_name: string; last_name: string; phone: string;
  notes: string | null; created_at: string;
}

interface MedicalEntry {
  id: string; date: string; content: string;
}

export default function DoctorPatientsPage() {
  const { fullT, language } = useLandingTranslation()
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [profId, setProfId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)

  // Details
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientApps, setClientApps] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ notes: '' })
  const [editingAppId, setEditingAppId] = useState<string | null>(null)
  const [appNoteEdit, setAppNoteEdit] = useState('')
  const [isSavingAppNote, setIsSavingAppNote] = useState(false)

  const fetchDoctorPatients = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: prof } = await supabase
      .from('professionals')
      .select('id, tenant_id')
      .eq('user_id', user.id)
      .single()

    if (prof) {
      setProfId(prof.id)
      setTenantId(prof.tenant_id)

      // Get only clients that have appointments with THIS professional
      const { data: appClients } = await supabase
        .from('appointments')
        .select(`client_id, clients(id, first_name, last_name, phone, notes, created_at)`)
        .eq('professional_id', prof.id)
        .order('created_at', { ascending: false })

      if (appClients) {
        const seen = new Set()
        const uniqueClients: Client[] = []
        appClients.forEach((ac: any) => {
          if (ac.clients && !seen.has(ac.clients.id)) {
            seen.add(ac.clients.id)
            uniqueClients.push(ac.clients)
          }
        })
        setClients(uniqueClients)
        setFilteredClients(uniqueClients)
      }
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchDoctorPatients()
  }, [fetchDoctorPatients])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredClients(clients.filter(c => 
        c.first_name.toLowerCase().includes(term) || 
        c.last_name.toLowerCase().includes(term) || 
        c.phone.includes(term)
      ))
    }
  }, [searchTerm, clients])

  async function openClientDetail(client: Client) {
    setSelectedClient(client)
    setIsEditing(false)
    const medical = parseMedicalNotes(client.notes)
    setEditData({ notes: medical.summary })
    
    const { data } = await supabase
      .from('appointments')
      .select(`id, status, start_at, notes, services(name)`)
      .eq('client_id', client.id)
      .eq('professional_id', profId)
      .order('start_at', { ascending: false })
    
    setClientApps(data || [])
  }

  const parseMedicalNotes = (notesStr: string | null) => {
    const defaultVal = { summary: '', logs: [] }
    if (!notesStr) return defaultVal
    try {
      const parsed = JSON.parse(notesStr)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return { summary: parsed.summary || '', logs: parsed.logs || [] }
      return { summary: notesStr, logs: [] }
    } catch (e) {
      return { summary: notesStr, logs: [] }
    }
  }

  const parseAppEntries = (notesStr: string | null): MedicalEntry[] => {
    if (!notesStr) return []
    try {
      const parsed = JSON.parse(notesStr)
      if (Array.isArray(parsed)) return parsed
      return [{ id: 'legacy', date: new Date().toISOString(), content: notesStr }]
    } catch (e) {
      return [{ id: 'legacy', date: new Date().toISOString(), content: notesStr }]
    }
  }

  async function handleAddAppPost(appId: string) {
    if (!appNoteEdit.trim()) return
    setIsSavingAppNote(true)
    const app = clientApps.find(a => a.id === appId)
    const currentEntries = parseAppEntries(app?.notes || null)
    const newEntry: MedicalEntry = { id: crypto.randomUUID(), date: new Date().toISOString(), content: appNoteEdit.trim() }
    const updatedEntries = [...currentEntries, newEntry]
    const updatedNotesStr = JSON.stringify(updatedEntries)

    const res = await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: appId, tenant_id: tenantId, notes: updatedNotesStr })
    })

    if (res.ok) {
      setClientApps(clientApps.map(a => a.id === appId ? { ...a, notes: updatedNotesStr } : a))
      setAppNoteEdit('')
    }
    setIsSavingAppNote(false)
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
      </div>
    )
  }

  const dateLocale = (dateLocales as any)[language]

  return (
    <>
      <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{fullT.nav_patients}</h1>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{language === 'es' ? 'Tus pacientes asignados' : 'Your assigned patients'}</p>
          </div>

          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={fullT.search_patients_placeholder}
              className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-20 text-center">
            <Users className="h-16 w-16 text-slate-100 mx-auto mb-6" />
            <h3 className="text-xl font-black text-slate-300">
              {searchTerm ? (language === 'es' ? 'No se encontraron resultados' : 'No results found') : (language === 'es' ? 'Aún no tienes pacientes asignados' : 'No patients assigned yet')}
            </h3>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredClients.map(client => (
              <button 
                key={client.id}
                onClick={() => openClientDetail(client)}
                className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group text-left"
              >
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xl border border-slate-100 group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-100 transition-colors">
                    {client.first_name[0]}{client.last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">{client.first_name} {client.last_name}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-1">
                      <Phone className="h-3.5 w-3.5" /> {client.phone}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-amber-500 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedClient && (
        <div className="fixed inset-0 z-[100] m-0 p-0 flex flex-col bg-slate-50 animate-in slide-in-from-right duration-300">
          <div className="bg-slate-900 px-6 py-4 text-white shadow-lg sticky top-0 z-10 w-full">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedClient(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center gap-2 text-sm font-bold">
                  <ChevronLeft className="h-5 w-5" /> {language === 'es' ? 'Volver' : 'Back'}
                </button>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-md font-black">
                    {selectedClient.first_name[0]}{selectedClient.last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-black leading-none">{selectedClient.first_name} {selectedClient.last_name}</h3>
                    <p className="text-slate-400 text-xs mt-1 font-bold">{selectedClient.phone}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="h-6 w-6 opacity-60" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 w-full">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Users className="h-4 w-4" /> {language === 'es' ? 'OBSERVACIONES GENERALES' : 'GENERAL OBSERVATIONS'}
                    </h4>
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-2 hover:bg-slate-50 rounded-xl text-amber-500 transition-all active:scale-95"
                    >
                      {isEditing ? <X className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <textarea 
                        value={editData.notes}
                        onChange={e => setEditData({ notes: e.target.value })}
                        className="w-full bg-slate-50 rounded-2xl p-5 text-sm font-medium text-slate-600 min-h-[150px] leading-relaxed border-none focus:ring-2 focus:ring-amber-500 outline-none"
                        placeholder={language === 'es' ? 'Escribe aquí la historia clínica general...' : 'Write general medical history here...'}
                      />
                      <button 
                        onClick={async () => {
                          const medical = parseMedicalNotes(selectedClient.notes)
                          const updatedNotes = JSON.stringify({ ...medical, summary: editData.notes })
                          const res = await fetch('/api/clients', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: selectedClient.id, tenant_id: tenantId, data: { notes: updatedNotes } })
                          })
                          if (res.ok) {
                            setSelectedClient({ ...selectedClient, notes: updatedNotes })
                            setIsEditing(false)
                          }
                        }}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 active:scale-95 transition-all"
                      >
                         {language === 'es' ? 'Guardar Observaciones' : 'Save Observations'}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-5 text-sm font-medium text-slate-600 min-h-[120px] leading-relaxed">
                      {parseMedicalNotes(selectedClient.notes).summary || (language === 'es' ? 'Sin observaciones previas' : 'No previous observations')}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[50vh]">
                  <h4 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-amber-500" /> {language === 'es' ? 'Historial con mis consultas' : 'History with my consultations'} ({clientApps.length})
                  </h4>

                  {clientApps.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-300 font-bold">
                      {language === 'es' ? 'No hay registros para tus consultas' : 'No records for your consultations'}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {clientApps.map(app => (
                        <div key={app.id} className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="text-md font-black text-slate-900">{app.services?.name || 'Consulta General'}</p>
                              <p className="text-xs font-bold text-slate-400 mt-1">
                                {format(parseISO(app.start_at), "d MMMM yyyy · HH:mm'h'", { locale: dateLocale })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${app.status === 'confirmed' || app.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : app.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>
                                {app.status === 'confirmed' ? (language === 'es' ? 'Confirmado' : 'Confirmed') : app.status === 'completed' ? (language === 'es' ? 'Completado' : 'Completed') : app.status === 'cancelled' ? (language === 'es' ? 'Cancelado' : 'Cancelled') : (language === 'es' ? 'Pendiente' : 'Pending')}
                              </span>
                              <button onClick={() => setEditingAppId(app.id)} className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-amber-500 transition-colors">
                                <User className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {parseAppEntries(app.notes).map(entry => (
                              <div key={entry.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{language === 'es' ? 'REGISTRO MÉDICO' : 'MEDICAL RECORD'}</span>
                                  <span className="text-[10px] text-slate-300 font-bold">{format(parseISO(entry.date), "HH:mm'h'", { locale: dateLocale })}</span>
                                </div>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed">{entry.content}</p>
                              </div>
                            ))}

                            <div className="bg-white/50 rounded-2xl p-4 border border-dashed border-slate-200">
                              <textarea
                                value={editingAppId === app.id ? appNoteEdit : ''}
                                onFocus={() => setEditingAppId(app.id)}
                                onChange={e => setAppNoteEdit(e.target.value)}
                                placeholder={language === 'es' ? 'Escribe tus notas de la consulta...' : 'Write your consultation notes...'}
                                className="w-full bg-transparent text-sm font-medium border-none focus:ring-0 resize-none placeholder-slate-300 min-h-[40px]"
                                rows={editingAppId === app.id ? 3 : 1}
                              />
                              {editingAppId === app.id && (
                                <div className="flex justify-end mt-2 gap-2">
                                  <button onClick={() => handleAddAppPost(app.id)} disabled={isSavingAppNote || !appNoteEdit.trim()} className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-xs font-black disabled:opacity-50">
                                    {isSavingAppNote ? '...' : (language === 'es' ? 'Guardar Nota' : 'Save Note')}
                                  </button>
                                  <button onClick={() => setEditingAppId(null)} className="text-slate-400 text-xs font-black px-3">{language === 'es' ? 'Cancelar' : 'Cancel'}</button>
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
          </div>
        </div>
      )}
    </>
  )
}
