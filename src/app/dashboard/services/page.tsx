"use client"

import { useEffect, useState } from 'react'
import { Briefcase, Clock, X, Plus, Trash2, Scissors, Stethoscope, Sparkles, DollarSign, Pencil, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price?: number;
  active: boolean;
}

const i18n = {
  es: {
    title: 'Servicios y Tratamientos', subtitle: 'Configura los servicios que ofreces y su duración estimada.',
    addBtn: 'Agregar Servicio', noServicesCreated: 'No has creado servicios aún.',
    createFirst: 'Crea el primero ahora', delConfirm: '¿Seguro que deseas eliminar este servicio? Las citas existentes no se borrarán.',
    newService: 'Nuevo Servicio', editService: 'Editar Servicio', serviceName: 'Nombre del Servicio',
    serviceNamePH: 'Ej: Limpieza dental', duration: 'Duración (min)',
    price: 'Precio (opcional)', saving: 'Guardando...', btnCreate: 'Crear Servicio', btnSave: 'Guardar Cambios'
  },
  it: {
    title: 'Servizi e Trattamenti', subtitle: 'Configura i servizi che offri e la loro durata.',
    addBtn: 'Aggiungi Servizio', noServicesCreated: 'Nessun servizio creato.',
    createFirst: 'Crea il primo', delConfirm: 'Sei sicuro di voler eliminare questo servizio?',
    newService: 'Nuovo Servizio', editService: 'Modifica Servizio', serviceName: 'Nome del Servizio',
    serviceNamePH: 'Es: Pulizia dentale', duration: 'Durata (min)',
    price: 'Prezzo', saving: 'Salvataggio...', btnCreate: 'Crea Servizio', btnSave: 'Salva Modifiche'
  },
  en: {
    title: 'Services and Treatments', subtitle: 'Configure the services you offer and their estimated duration.',
    addBtn: 'Add Service', noServicesCreated: 'No services created yet.',
    createFirst: 'Create the first one now', delConfirm: 'Are you sure you want to delete this service? Existing appointments will not be deleted.',
    newService: 'New Service', editService: 'Edit Service', serviceName: 'Service Name',
    serviceNamePH: 'Ex: Dental Cleaning', duration: 'Duration (min)',
    price: 'Price (optional)', saving: 'Saving...', btnCreate: 'Create Service', btnSave: 'Save Changes'
  }
}

export default function ServicesPage() {
  const supabase = createClient()
  const [services, setServices] = useState<Service[]>([])
  const [tenantId, setTenantId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [lang, setLang] = useState<'en' | 'es' | 'it'>('es')

  const [formData, setFormData] = useState({ name: '', duration_minutes: 30, price: 0 })

  useEffect(() => { initTenant() }, [])
  useEffect(() => { if (tenantId) fetchServices() }, [tenantId])

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

  async function fetchServices() {
    setLoading(true)
    const res = await fetch(`/api/services?tenant_id=${tenantId}`)
    if (res.ok) setServices(await res.json())
    setLoading(false)
  }

  async function handleAddService() {
    if (!formData.name) return
    setSaving(true)
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, ...formData })
    })
    if (res.ok) {
      setShowAddForm(false)
      setFormData({ name: '', duration_minutes: 30, price: 0 })
      fetchServices()
    }
    setSaving(false)
  }

  async function handleEditService() {
    if (!editService || !editService.name) return
    setSaving(true)
    const res = await fetch('/api/services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editService.id,
        tenant_id: tenantId,
        name: editService.name,
        duration_minutes: editService.duration_minutes,
        price: editService.price
      })
    })
    if (res.ok) {
      setSavedId(editService.id)
      setTimeout(() => setSavedId(null), 1500)
      setEditService(null)
      fetchServices()
    }
    setSaving(false)
  }

  async function handleDeleteService(id: string) {
    const T = i18n[lang]
    if (!confirm(T.delConfirm)) return
    const res = await fetch(`/api/services?id=${id}&tenant_id=${tenantId}`, { method: 'DELETE' })
    if (res.ok) fetchServices()
  }

  function openEditModal(service: Service) {
    setEditService({ ...service })
  }

  const T = i18n[lang]

  const serviceIcon = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('limp') || lower.includes('puli')) return <Sparkles className="h-6 w-6" />
    if (lower.includes('extr') || lower.includes('dent')) return <Stethoscope className="h-6 w-6" />
    return <Briefcase className="h-6 w-6" />
  }

  const duration_options = [15, 30, 45, 60, 90, 120]
  const duration_labels: Record<number, string> = { 15: '15 min', 30: '30 min', 45: '45 min', 60: '1h', 90: '1h 30m', 120: '2h' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{T.title}</h1>
          <p className="text-sm text-gray-500">{T.subtitle}</p>
        </div>
        <button onClick={() => setShowAddForm(true)}
          className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-colors">
          <Plus className="-ml-1 mr-2 h-5 w-5" /> {T.addBtn}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-3xl" />)}
        </div>
      ) : services.length === 0 ? (
        <div className="py-20 text-center text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-100 shadow-sm">
          <Scissors className="mx-auto h-12 w-12 mb-4 opacity-10" />
          <p className="font-medium text-lg text-gray-400">{T.noServicesCreated}</p>
          <button onClick={() => setShowAddForm(true)} className="text-primary-600 font-bold mt-2 hover:underline">{T.createFirst}</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <div key={service.id} className={`bg-white rounded-3xl border p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden ${savedId === service.id ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                  {serviceIcon(service.name)}
                </div>
                {savedId === service.id ? (
                  <div className="p-2 text-emerald-500"><CheckCircle className="h-5 w-5" /></div>
                ) : (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(service)}
                      className="p-2 text-gray-300 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-all">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteService(service.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{service.name}</h3>

              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full text-xs font-bold text-gray-600 border border-gray-100">
                  <Clock className="h-3.5 w-3.5 text-primary-500" />
                  {duration_labels[service.duration_minutes] || `${service.duration_minutes} min`}
                </div>
                {service.price && service.price > 0 && (
                  <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-700 border border-emerald-100">
                    <DollarSign className="h-3.5 w-3.5" />
                    {service.price}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal (shared) */}
      {(showAddForm || editService) && (() => {
        const isEdit = !!editService
        const currentData = isEdit ? editService : formData
        const setField = (field: string, value: any) => {
          if (isEdit) setEditService(prev => prev ? { ...prev, [field]: value } : null)
          else setFormData(prev => ({ ...prev, [field]: value }))
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
            onClick={() => { setShowAddForm(false); setEditService(null) }}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-gray-900">{isEdit ? T.editService : T.newService}</h3>
                  <button onClick={() => { setShowAddForm(false); setEditService(null) }} className="p-2 rounded-full hover:bg-gray-100">
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{T.serviceName}</label>
                    <input autoFocus value={currentData.name}
                      onChange={e => setField('name', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      placeholder={T.serviceNamePH} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{T.duration}</label>
                      <select value={currentData.duration_minutes}
                        onChange={e => setField('duration_minutes', parseInt(e.target.value))}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                        {duration_options.map(d => (
                          <option key={d} value={d}>{duration_labels[d]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{T.price}</label>
                      <input type="number" value={currentData.price || 0}
                        onChange={e => setField('price', parseFloat(e.target.value))}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        placeholder="0.00" />
                    </div>
                  </div>

                  <button
                    onClick={isEdit ? handleEditService : handleAddService}
                    disabled={saving || !currentData.name}
                    className="w-full py-4 rounded-2xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all disabled:opacity-50 mt-4">
                    {saving ? T.saving : isEdit ? T.btnSave : T.btnCreate}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
