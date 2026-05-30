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
import { NewPatientDrawer } from '@/components/clients/NewPatientDrawer'
import { useRouter } from 'next/navigation'

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  notes: string | null;
  created_at: string;
  appointments?: {
    start_at: string;
    status: string;
    professionals?: any; // Handle array or object from Supabase
  }[];
}

export default function ClientsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [lang, setLang] = useState<'en' | 'es' | 'it'>('es')
  const [loading, setLoading] = useState(true)
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false)
  const [filterActive, setFilterActive] = useState(false)

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
        appointments(start_at, status, professionals(full_name))
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
    let filtered = clients
    
    // Search Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(c => 
        c.first_name.toLowerCase().includes(term) || 
        c.last_name.toLowerCase().includes(term) || 
        c.phone.includes(term) ||
        (c.notes && c.notes.toLowerCase().includes(term))
      )
    }

    // Active Status Filter
    if (filterActive) {
      filtered = filtered.filter(c => getStatus(c) === 'active')
    }

    setFilteredClients(filtered)
  }, [searchTerm, clients, filterActive])

  async function openClientDetail(client: Client) {
    router.push(`/dashboard/clients/${client.id}`)
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

  const getLastDoctor = (client: Client) => {
    if (!client.appointments || client.appointments.length === 0) return '-'
    const lastApp = client.appointments.reduce((latest, current) => {
      return isAfter(parseISO(current.start_at), parseISO(latest.start_at)) ? current : latest
    }, client.appointments[0])
    
    const prof = lastApp.professionals
    if (Array.isArray(prof)) return prof[0]?.full_name || '-'
    return prof?.full_name || '-'
  }

  async function handleCreatePatient(data: { first_name: string; last_name: string; phone: string; notes: string }) {
    if (!tenantId) return
    
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenantId,
        ...data
      })
    })

    if (res.ok) {
      await fetchClients()
    } else {
      const err = await res.json()
      throw new Error(err.error || 'Failed to create patient')
    }
  }



  return (
    <div className="min-h-screen bg-surface p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* Editorial Header */}
      <header className="mb-6 md:mb-12 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-secondary-900 tracking-tight mb-2">
            {t.patient_management}
          </h1>
          <p className="text-secondary-600 font-bold uppercase tracking-widest text-[10px] bg-secondary-50 px-3 py-1 rounded-full inline-block">
            {clients.length} {t.active_patients}
          </p>
        </div>
        <button 
          onClick={() => setIsNewPatientOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-primary-light transition-all shadow-lg shadow-primary/20 active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          {t.new_patient}
        </button>
      </header>

      {/* Action Bar */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-500 group-focus-within:text-primary-600 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t.search_placeholder}
            className="w-full bg-white border border-surface-container-low rounded-xl py-3 md:py-4 pl-12 pr-4 text-sm font-bold text-secondary-900 focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all outline-none"
          />
        </div>
        <button 
          onClick={() => setFilterActive(!filterActive)}
          className={`p-3 md:p-4 border rounded-xl transition-all shadow-sm ${
            filterActive 
              ? 'bg-primary-600 border-primary-600 text-white' 
              : 'bg-white border-surface-container-low text-secondary-600 hover:text-primary-600 hover:border-primary-600'
          }`}
        >
          <Filter className="h-5 w-5" />
        </button>
      </div>

      {/* Patient Table - Desktop */}
      <div className="hidden md:block bg-white rounded-2xl border border-surface-container-low overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface-container-low bg-precision-surface-lowest">
              <th className="px-4 py-4 text-[10px] font-black text-secondary-600 uppercase tracking-widest">{t.name}</th>
              <th className="px-4 py-4 text-[10px] font-black text-secondary-600 uppercase tracking-widest">{t.professional}</th>
              <th className="px-4 py-4 text-[10px] font-black text-secondary-600 uppercase tracking-widest">{t.phone}</th>
              <th className="px-4 py-4 text-[10px] font-black text-secondary-600 uppercase tracking-widest">{t.last_visit}</th>
              <th className="px-4 py-4 text-[10px] font-black text-secondary-600 uppercase tracking-widest">{t.status}</th>
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
                return (
                  <tr
                    key={client.id}
                    onClick={() => openClientDetail(client)}
                    className="cursor-pointer transition-all hover:bg-precision-surface-lowest"
                  >
                    <td className="px-6 py-5">
                      <p className="text-sm font-black tracking-tight text-secondary-900">
                        {client.first_name} {client.last_name}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-secondary-600 uppercase tracking-widest">
                        {getLastDoctor(client)}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-secondary-700">
                      {client.phone}
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-secondary-700">
                      {getLastVisit(client)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        status === 'active' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-surface-container-mid text-secondary-600'
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

      {/* Patient Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-12 text-center opacity-40 bg-white rounded-2xl border border-surface-container-low">
            <p className="text-xs font-black uppercase tracking-widest">{t.no_patients_found}</p>
          </div>
        ) : (
          filteredClients.map(client => {
            const status = getStatus(client)
            return (
              <button
                key={client.id}
                onClick={() => openClientDetail(client)}
                className="w-full text-left bg-white rounded-2xl border border-surface-container-low p-4 shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black tracking-tight text-secondary-900 truncate">
                      {client.first_name} {client.last_name}
                    </p>
                    <p className="text-xs font-bold text-secondary-600 uppercase tracking-widest mt-0.5 truncate">
                      {getLastDoctor(client)}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    status === 'active' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-surface-container-mid text-secondary-600'
                   }`}>
                    {status === 'active' ? t.active_status : t.inactive_status}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-surface-container-low grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">{t.phone}</p>
                    <p className="text-xs font-bold text-secondary-700 truncate">{client.phone}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">{t.last_visit}</p>
                    <p className="text-xs font-bold text-secondary-700 truncate">{getLastVisit(client)}</p>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Patient Drawers */}
      <AnimatePresence>
        {isNewPatientOpen && (
          <NewPatientDrawer
            isOpen={isNewPatientOpen}
            onClose={() => setIsNewPatientOpen(false)}
            lang={lang}
            translations={t}
            tenantId={tenantId}
            onCreatePatient={handleCreatePatient}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
