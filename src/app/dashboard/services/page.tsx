"use client"

import { useEffect, useState } from 'react'
import { Briefcase, Clock, X, Plus, Trash2, Scissors, Stethoscope, Sparkles, DollarSign, Pencil, CheckCircle } from 'lucide-react'
import { translations, Language } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price?: number;
  active: boolean;
}

export default function ServicesPage() {
  const supabase = createClient()
  const [services, setServices] = useState<Service[]>([])
  const [tenantId, setTenantId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
  const [lang, setLang] = useState<Language>('es')
  const [savedId, setSavedId] = useState<string | null>(null)

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
      setLang((tenant.settings?.language as Language) || 'es')
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
    const T = T_LEGACY[lang]
    if (!confirm(T.delConfirm)) return
    const res = await fetch(`/api/services?id=${id}&tenant_id=${tenantId}`, { method: 'DELETE' })
    if (res.ok) fetchServices()
  }

  function openEditModal(service: Service) {
    setEditService({ ...service })
  }

  const T_LEGACY = {
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

  const T = T_LEGACY[lang] || T_LEGACY['es']

  const serviceIcon = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('limp') || lower.includes('puli')) return <Sparkles className="h-6 w-6" />
    if (lower.includes('extr') || lower.includes('dent')) return <Stethoscope className="h-6 w-6" />
    return <Briefcase className="h-6 w-6" />
  }

  const duration_options = [15, 30, 45, 60, 90, 120]
  const duration_labels: Record<number, string> = { 15: '15 min', 30: '30 min', 45: '45 min', 60: '1h', 90: '1h 30m', 120: '2h' }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-on-surface tracking-tight">{T.title}</h1>
          <p className="text-sm font-medium text-on-surface/60 mt-1">{T.subtitle}</p>
        </div>
        <button onClick={() => setShowAddForm(true)}
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-ambient hover:bg-primary-container active:scale-[0.98] transition-all">
          <Plus className="-ml-1 mr-2 h-5 w-5" /> {T.addBtn}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-surface-container-low rounded-[2rem]" />)}
        </div>
      ) : services.length === 0 ? (
        <div className="py-24 text-center bg-surface-container-lowest rounded-[2.5rem] shadow-sm">
          <div className="h-20 w-20 bg-surface-container-low rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Scissors className="h-10 w-10 text-on-surface/20" />
          </div>
          <p className="font-black text-xl text-on-surface tracking-tight mb-2">{T.noServicesCreated}</p>
          <button onClick={() => setShowAddForm(true)} className="text-primary font-bold hover:text-primary-container transition-colors">{T.createFirst}</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <div key={service.id} className={`bg-surface-container-lowest rounded-[2rem] p-8 transition-all duration-300 group relative overflow-hidden shadow-sm hover:shadow-ambient ${savedId === service.id ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
              <div className="flex items-start justify-between mb-6">
                <div className="h-14 w-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                  {serviceIcon(service.name)}
                </div>
                {savedId === service.id ? (
                  <div className="p-2 text-primary animate-in zoom-in-50"><CheckCircle className="h-6 w-6" /></div>
                ) : (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                    <button onClick={() => openEditModal(service)}
                      className="h-10 w-10 bg-surface-container-low text-on-surface/40 hover:text-primary hover:bg-surface-container-highest rounded-xl flex items-center justify-center transition-all">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteService(service.id)}
                      className="h-10 w-10 bg-surface-container-low text-on-surface/40 hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-xl flex items-center justify-center transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-black text-on-surface tracking-tight mb-4 group-hover:text-primary transition-colors">{service.name}</h3>

              <div className="flex flex-wrap gap-3 mt-auto">
                <div className="flex items-center gap-1.5 bg-surface-container-low px-4 py-2 rounded-xl text-xs font-bold text-on-surface/70">
                  <Clock className="h-4 w-4 text-primary" />
                  {duration_labels[service.duration_minutes] || `${service.duration_minutes} min`}
                </div>
                {service.price && service.price > 0 && (
                  <div className="flex items-center gap-1.5 bg-secondary-container text-on-secondary-container px-4 py-2 rounded-xl text-xs font-bold">
                    <DollarSign className="h-4 w-4" />
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => { setShowAddForm(false); setEditService(null) }}>
            <div className="absolute inset-0 bg-on-surface/10 backdrop-blur-3xl animate-in fade-in duration-500" />
            <div className="relative bg-surface-container-lowest rounded-[2rem] shadow-spatial w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-on-surface tracking-tight">{isEdit ? T.editService : T.newService}</h3>
                  <button onClick={() => { setShowAddForm(false); setEditService(null) }} className="p-2 rounded-full text-on-surface/40 hover:bg-surface-container-low hover:text-on-surface transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-on-surface/50 uppercase tracking-widest ml-1">{T.serviceName}</label>
                    <input autoFocus value={currentData.name}
                      onChange={e => setField('name', e.target.value)}
                      className="w-full rounded-2xl border-none bg-surface-container-low px-5 py-4 text-sm font-bold text-on-surface placeholder-on-surface/30 focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                      placeholder={T.serviceNamePH} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-on-surface/50 uppercase tracking-widest ml-1">{T.duration}</label>
                      <select value={currentData.duration_minutes}
                        onChange={e => setField('duration_minutes', parseInt(e.target.value))}
                        className="w-full rounded-2xl border-none bg-surface-container-low px-5 py-4 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm">
                        {duration_options.map(d => (
                          <option key={d} value={d}>{duration_labels[d]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-on-surface/50 uppercase tracking-widest ml-1">{T.price}</label>
                      <input type="number" value={currentData.price || 0}
                        onChange={e => setField('price', parseFloat(e.target.value))}
                        className="w-full rounded-2xl border-none bg-surface-container-low px-5 py-4 text-sm font-bold text-on-surface placeholder-on-surface/30 focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                        placeholder="0.00" />
                    </div>
                  </div>

                  <button
                    onClick={isEdit ? handleEditService : handleAddService}
                    disabled={saving || !currentData.name}
                    className="w-full py-5 rounded-full bg-primary text-on-primary font-black uppercase tracking-[0.2em] text-xs hover:bg-primary-container shadow-ambient active:scale-95 transition-all disabled:opacity-50 mt-8">
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
