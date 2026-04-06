"use client"

import { useEffect, useState, useCallback } from 'react'
import { Search, User, Phone, Calendar, X, ChevronRight, Edit2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { it } from 'date-fns/locale/it'
import { enUS } from 'date-fns/locale/en-US'

// ── i18n strings ──────────────────────────────────────────────────────────────
const i18n = {
  es: {
    title: 'Gestión de Clientes', subtitle: 'Consulta las fichas de tus pacientes y su historial de citas.',
    searchPlaceholder: 'Buscar por nombre o teléfono...', noClients: 'No se encontraron pacientes.',
    editPatient: 'Editar paciente', editData: 'Editar Datos del Paciente',
    name: 'Nombre', lastName: 'Apellido', optional: 'Opcional', phone: 'Teléfono',
    save: 'Guardar Cambios', cancel: 'Cancelar', history: 'Historial de Citas',
    noApps: 'Este paciente no tiene citas registradas.', noService: 'Sin servicio',
    status: {
      confirmed: { text: 'Confirmada', cls: 'bg-emerald-100 text-emerald-700' },
      cancelled: { text: 'Cancelada', cls: 'bg-red-100 text-red-700' },
      completed: { text: 'Completada', cls: 'bg-blue-100 text-blue-700' },
      pending: { text: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700' }
    },
    errorSave: 'Error al guardar: '
  },
  it: {
    title: 'Gestione Clienti', subtitle: 'Consulta le schede dei tuoi pazienti e la loro cronologia appuntamenti.',
    searchPlaceholder: 'Cerca per nome o telefono...', noClients: 'Nessun paziente trovato.',
    editPatient: 'Modifica paziente', editData: 'Modifica Dati Paziente',
    name: 'Nome', lastName: 'Cognome', optional: 'Opzionale', phone: 'Telefono',
    save: 'Salva Modifiche', cancel: 'Annulla', history: 'Cronologia Appuntamenti',
    noApps: 'Questo paziente non ha appuntamenti registrati.', noService: 'Senza servizio',
    status: {
      confirmed: { text: 'Confermata', cls: 'bg-emerald-100 text-emerald-700' },
      cancelled: { text: 'Annullata', cls: 'bg-red-100 text-red-700' },
      completed: { text: 'Completata', cls: 'bg-blue-100 text-blue-700' },
      pending: { text: 'In attesa', cls: 'bg-yellow-100 text-yellow-700' }
    },
    errorSave: 'Errore durante il salvataggio: '
  },
  en: {
    title: 'Client Management', subtitle: 'View patient files and their appointment history.',
    searchPlaceholder: 'Search by name or phone...', noClients: 'No patients found.',
    editPatient: 'Edit patient', editData: 'Edit Patient Data',
    name: 'First Name', lastName: 'Last Name', optional: 'Optional', phone: 'Phone',
    save: 'Save Changes', cancel: 'Cancel', history: 'Appointment History',
    noApps: 'This patient has no registered appointments.', noService: 'No service',
    status: {
      confirmed: { text: 'Confirmed', cls: 'bg-emerald-100 text-emerald-700' },
      cancelled: { text: 'Cancelled', cls: 'bg-red-100 text-red-700' },
      completed: { text: 'Completed', cls: 'bg-blue-100 text-blue-700' },
      pending: { text: 'Pending', cls: 'bg-yellow-100 text-yellow-700' }
    },
    errorSave: 'Error saving: '
  }
}

interface Client {
  id: string; first_name: string; last_name: string; phone: string;
  created_at: string; appointments?: any[];
}

export default function ClientsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientApps, setClientApps] = useState<any[]>([])
  const [tenantId, setTenantId] = useState('')
  const [lang, setLang] = useState<'en' | 'es' | 'it'>('es')
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ first_name: '', last_name: '', phone: '' })

  const initTenant = useCallback(async () => {
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
      setLang((tenant.settings?.language as 'en'|'es'|'it') || 'es')
    }
  }, [supabase])

  const fetchClients = useCallback(async () => {
    if (!tenantId) return
    const { data } = await supabase
      .from('clients')
      .select('id, first_name, last_name, phone, created_at')
      .eq('tenant_id', tenantId)
      .order('first_name')
    if (data) {
      const real = data.filter(c => !c.phone.startsWith('tg_'))
      setClients(real)
      setFilteredClients(real)
    }
  }, [supabase, tenantId])

  useEffect(() => { initTenant() }, [initTenant])
  useEffect(() => { fetchClients() }, [fetchClients])

  useEffect(() => {
    if (!tenantId) return
    const channel = supabase.channel('rt_clients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchClients())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tenantId, fetchClients, supabase])

  useEffect(() => {
    if (!searchTerm.trim()) { setFilteredClients(clients) } else {
      const term = searchTerm.toLowerCase()
      setFilteredClients(clients.filter(c => c.first_name.toLowerCase().includes(term) || c.last_name.toLowerCase().includes(term) || c.phone.includes(term)))
    }
  }, [searchTerm, clients])

  async function openClientDetail(client: Client) {
    setSelectedClient(client)
    setIsEditing(false)
    setEditData({ first_name: client.first_name || '', last_name: client.last_name || '', phone: client.phone || '' })
    const { data } = await supabase.from('appointments').select(`id, status, start_at, end_at, notes, services(name), professionals(full_name)`).eq('client_id', client.id).order('start_at', { ascending: false })
    setClientApps(data || [])
  }

  async function handleSaveEdit() {
    if (!selectedClient) return
    const { error } = await supabase.from('clients').update({ first_name: editData.first_name, last_name: editData.last_name || null, phone: editData.phone }).eq('id', selectedClient.id)
    if (!error) {
      setSelectedClient({ ...selectedClient, ...editData, last_name: editData.last_name || '' })
      setIsEditing(false)
    } else { alert((i18n[lang] || i18n['en']).errorSave + error.message) }
  }

  const T = i18n[lang] || i18n['en']
  const dateLocale = lang === 'it' ? it : (lang === 'es' ? es : enUS)
  const statusLabel = (s: string) => T.status[s as keyof typeof T.status] || T.status.pending

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{T.title}</h1>
        <p className="text-sm text-gray-500">{T.subtitle}</p>
      </div>

      <div className="relative max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="block w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm"
          placeholder={T.searchPlaceholder} />
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <User className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">{T.noClients}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredClients.map(c => (
              <button key={c.id} onClick={() => openClientDetail(c)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-primary-50/40 transition-colors text-left group">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                  {c.first_name.charAt(0)}{c.last_name?.charAt(0) || ''}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.first_name} {c.last_name}</p>
                  <p className="text-xs text-gray-500">{c.phone}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedClient(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                    {selectedClient.first_name.charAt(0)}{selectedClient.last_name?.charAt(0) || ''}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{selectedClient.first_name} {selectedClient.last_name}</h3>
                    <p className="text-primary-100 text-sm flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedClient.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-full hover:bg-white/20 transition-colors" title={T.editPatient}>
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => setSelectedClient(null)} className="p-1 rounded-full hover:bg-white/20 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isEditing ? (
                <div className="space-y-4">
                   <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">{T.editData}</h4>
                   <div>
                     <label className="block text-xs font-semibold text-gray-700 mb-1">{T.name}</label>
                     <input type="text" value={editData.first_name} onChange={e => setEditData({...editData, first_name: e.target.value})} className="block w-full rounded-xl border-gray-200 bg-gray-50/50 py-2.5 px-3 text-sm text-gray-900 border focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500 transition-all"/>
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-gray-700 mb-1">{T.lastName} <span className="text-gray-400 font-normal">({T.optional})</span></label>
                     <input type="text" value={editData.last_name} onChange={e => setEditData({...editData, last_name: e.target.value})} className="block w-full rounded-xl border-gray-200 bg-gray-50/50 py-2.5 px-3 text-sm text-gray-900 border focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500 transition-all"/>
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-gray-700 mb-1">{T.phone}</label>
                     <input type="text" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="block w-full rounded-xl border-gray-200 bg-gray-50/50 py-2.5 px-3 text-sm text-gray-900 border focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500 transition-all"/>
                   </div>
                   <div className="pt-4 flex gap-3">
                     <button onClick={handleSaveEdit} className="bg-primary-600 hover:bg-primary-700 transition-colors text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm flex-1">{T.save}</button>
                     <button onClick={() => setIsEditing(false)} className="bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold">{T.cancel}</button>
                   </div>
                </div>
              ) : (
                <>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Calendar className="h-4 w-4" /> {T.history} ({clientApps.length})</h4>
                  {clientApps.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">{T.noApps}</p>
                  ) : (
                    <div className="space-y-2">
                       {clientApps.map(app => {
                         const st = statusLabel(app.status)
                         return (
                           <div key={app.id} className="border border-gray-100 rounded-xl p-3 bg-white hover:border-primary-100 hover:shadow-sm transition-all group">
                             <div className="flex items-center justify-between">
                               <p className="text-sm font-semibold text-gray-900">{app.services?.name || T.noService}</p>
                               <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${st.cls}`}>{st.text}</span>
                             </div>
                             <p className="text-xs text-gray-500 mt-1 font-medium">{format(parseISO(app.start_at), "d MMM yyyy 'HH:mm'", { locale: dateLocale })} · {app.professionals?.full_name}</p>
                             {app.notes && <p className="text-xs text-gray-400 mt-2 bg-gray-50 p-2 rounded-lg italic">💬 {app.notes}</p>}
                           </div>
                         )
                       })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
