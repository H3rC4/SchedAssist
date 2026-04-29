"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { Search, Plus, Loader2, ChevronRight, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { translations } from '@/lib/i18n'
import { format, parseISO, isAfter, subMonths } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { it } from 'date-fns/locale/it'
import { enUS } from 'date-fns/locale/en-US'
import { PatientMedicalRecordDrawer } from '@/components/clients/PatientMedicalRecordDrawer'
import { useRouter } from 'next/navigation'

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  notes: string | null;
  created_at: string;
  appointments?: any[];
}

export default function ClientsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientApps, setClientApps] = useState<any[]>([])
  const [clinicalRecords, setClinicalRecords] = useState<any[]>([])
  const [tenantId, setTenantId] = useState('')
  const [lang, setLang] = useState<'en' | 'es' | 'it'>('es')
  const [loading, setLoading] = useState(true)

  const fetchClinicalRecords = useCallback(async (clientId: string) => {
    if (!tenantId || !clientId) return
    const res = await fetch(`/api/clinical-records?tenant_id=${tenantId}&client_id=${clientId}`)
    if (res.ok) {
      const data = await res.json()
      setClinicalRecords(data)
    }
  }, [tenantId])

  const initTenant = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: tuData } = await supabase
      .from('tenant_users')
      .select('tenant_id, role, tenants(id, settings)')
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
    setLoading(true)
    const { data } = await supabase
      .from('clients')
      .select(`
        id, first_name, last_name, phone, notes, created_at,
        appointments(start_at, status)
      `)
      .eq('tenant_id', tenantId)
      .order('first_name')
    
    if (data) {
      const real = data.filter(c => !c.phone.startsWith('tg_'))
      setClients(real)
      setFilteredClients(real)
    }
    setLoading(false)
  }, [supabase, tenantId])

  useEffect(() => { initTenant() }, [initTenant])
  useEffect(() => { fetchClients() }, [fetchClients])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredClients(clients.filter(c => 
        c.first_name.toLowerCase().includes(term) || 
        c.last_name.toLowerCase().includes(term) || 
        c.phone.includes(term) ||
        (c.notes && c.notes.toLowerCase().includes(term))
      ))
    }
  }, [searchTerm, clients])

  async function openClientDetail(client: Client) {
    setSelectedClient(client)
    const { data } = await supabase
      .from('appointments')
      .select(`id, status, start_at, end_at, notes, services(name), professionals(full_name)`)
      .eq('client_id', client.id)
      .order('start_at', { ascending: false })
    
    setClientApps(data || [])
    fetchClinicalRecords(client.id)
  }

  const t = translations[lang] || translations['en']
  const dateLocale = lang === 'it' ? it : (lang === 'es' ? es : enUS)

  const getStatus = (client: Client) => {
    if (!client.appointments || client.appointments.length === 0) return 'inactive'
    const lastApp = client.appointments.reduce((latest, current) => {
      return isAfter(parseISO(current.start_at), parseISO(latest.start_at)) ? current : latest
    }, client.appointments[0])
    
    const sixMonthsAgo = subMonths(new Date(), 6)
    return isAfter(parseISO(lastApp.start_at), sixMonthsAgo) ? 'active' : 'inactive'
  }

  const getLastVisit = (client: Client) => {
    if (!client.appointments || client.appointments.length === 0) return 'N/A'
    const lastApp = client.appointments.reduce((latest, current) => {
      return isAfter(parseISO(current.start_at), parseISO(latest.start_at)) ? current : latest
    }, client.appointments[0])
    return format(parseISO(lastApp.start_at), 'MMM d, yyyy', { locale: dateLocale })
  }

  return (
    <div className="min-h-screen bg-surface p-8 max-w-[1600px] mx-auto">
      {/* Editorial Header */}
      <header className="mb-12 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black text-secondary-900 tracking-tight mb-2">
            {t.patient_management}
          </h1>
          <p className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">
            {clients.length} {t.active_patients}
          </p>
        </div>
        <button className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 active:scale-95">
          <Plus className="h-4 w-4" />
          {t.new_patient}
        </button>
      </header>

      {/* Action Bar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-300 group-focus-within:text-primary-600 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t.search_placeholder}
            className="w-full bg-white border border-surface-container-low rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-secondary-900 focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all outline-none"
          />
        </div>
        <button className="p-4 bg-white border border-surface-container-low rounded-xl text-secondary-400 hover:text-primary-600 hover:border-primary-600 transition-all">
          <Filter className="h-5 w-5" />
        </button>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-surface-container-low overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface-container-low bg-precision-surface-lowest">
              <th className="px-6 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">{t.name}</th>
              <th className="px-6 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">{t.id}</th>
              <th className="px-6 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">{t.phone}</th>
              <th className="px-6 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">{t.last_visit}</th>
              <th className="px-6 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">{t.status}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center opacity-40">
                  <p className="text-xs font-black uppercase tracking-widest">{t.no_patients_found}</p>
                </td>
              </tr>
            ) : (
              filteredClients.map(client => {
                const status = getStatus(client)
                const isSelected = selectedClient?.id === client.id
                return (
                  <tr
                    key={client.id}
                    onClick={() => openClientDetail(client)}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-primary-600/5 shadow-[inset_0_0_0_2px_rgba(37,99,235,0.1)]' 
                        : 'hover:bg-precision-surface-lowest'
                    }`}
                  >
                    <td className="px-6 py-5">
                      <p className={`text-sm font-black tracking-tight ${isSelected ? 'text-primary-600' : 'text-secondary-900'}`}>
                        {client.first_name} {client.last_name}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest">
                        {client.id.slice(0, 8).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-secondary-500">
                      {client.phone}
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-secondary-500">
                      {getLastVisit(client)}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        status === 'active' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-surface-container-mid text-secondary-400'
                      }`}>
                        {status === 'active' ? t.active_status : t.inactive_status}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Patient Drawer */}
      {selectedClient && (
        <PatientMedicalRecordDrawer
          patient={selectedClient}
          isOpen={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          history={clinicalRecords}
          appointments={clientApps}
          lang={lang}
          translations={t}
          onAddNote={() => {
            // Future implementation for adding notes directly from drawer
          }}
          onScheduleAppointment={() => {
            router.push('/dashboard/appointments')
          }}
        />
      )}
    </div>
  )
}
