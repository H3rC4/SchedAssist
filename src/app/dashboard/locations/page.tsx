"use client"

import { useEffect, useState } from 'react'
import { MapPin, Plus, Trash2, Pencil, CheckCircle, X, Building2, Map as MapIcon, Navigation } from 'lucide-react'
import { translations, Language } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  active: boolean;
}

export default function LocationsPage() {
  const supabase = createClient()
  const [locations, setLocations] = useState<Location[]>([])
  const [tenantId, setTenantId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editLocation, setEditLocation] = useState<Location | null>(null)
  const [lang, setLang] = useState<Language>('es')
  const [savedId, setSavedId] = useState<string | null>(null)

  const [formData, setFormData] = useState({ name: '', address: '', city: '' })

  useEffect(() => { initTenant() }, [])
  useEffect(() => { if (tenantId) fetchLocations() }, [tenantId])

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

  async function fetchLocations() {
    setLoading(true)
    const res = await fetch(`/api/locations?tenant_id=${tenantId}`)
    if (res.ok) setLocations(await res.json())
    setLoading(false)
  }

  async function handleAddLocation() {
    if (!formData.name) return
    setSaving(true)
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, ...formData })
    })
    if (res.ok) {
      setShowAddForm(false)
      setFormData({ name: '', address: '', city: '' })
      fetchLocations()
    }
    setSaving(false)
  }

  async function handleEditLocation() {
    if (!editLocation || !editLocation.name) return
    setSaving(true)
    const res = await fetch('/api/locations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editLocation.id,
        tenant_id: tenantId,
        name: editLocation.name,
        address: editLocation.address,
        city: editLocation.city,
        active: editLocation.active
      })
    })
    if (res.ok) {
      setSavedId(editLocation.id)
      setTimeout(() => setSavedId(null), 1500)
      setEditLocation(null)
      fetchLocations()
    }
    setSaving(false)
  }

  async function handleDeleteLocation(id: string) {
    if (!confirm(T.delConfirm)) return
    const res = await fetch(`/api/locations?id=${id}&tenant_id=${tenantId}`, { method: 'DELETE' })
    if (res.ok) fetchLocations()
  }

  const T_MAP = {
    es: {
      title: 'Sedes y Sucursales', subtitle: 'Administra las diferentes ubicaciones de tu clínica.',
      addBtn: 'Nueva Sede', noLocations: 'No has configurado sedes aún.',
      delConfirm: '¿Seguro que deseas eliminar esta sede?',
      newLoc: 'Nueva Sede', editLoc: 'Editar Sede', locName: 'Nombre de la Sede',
      address: 'Dirección', city: 'Ciudad', saving: 'Guardando...', btnCreate: 'Crear Sede', btnSave: 'Guardar Cambios',
      active: 'Activa', inactive: 'Inactiva', viewAgenda: 'Ver Agenda', modalSubtitle: 'Completa la información de la sucursal'
    },
    it: {
      title: 'Sedi e Filiali', subtitle: 'Gestisci le diverse sedi della tua clinica.',
      addBtn: 'Nuova Sede', noLocations: 'Nessuna sede configurata.',
      delConfirm: 'Sei sicuro di voler eliminare questa sede?',
      newLoc: 'Nuova Sede', editLoc: 'Modifica Sede', locName: 'Nome della Sede',
      address: 'Indirizzo', city: 'Città', saving: 'Salvataggio...', btnCreate: 'Crea Sede', btnSave: 'Salva Modifiche',
      active: 'Attiva', inactive: 'Inattiva', viewAgenda: 'Vedi Agenda', modalSubtitle: 'Completa le informazioni della filiale'
    },
    en: {
      title: 'Locations and Branches', subtitle: 'Manage the different locations of your clinic.',
      addBtn: 'New Location', noLocations: 'No locations configured yet.',
      delConfirm: 'Are you sure you want to delete this location?',
      newLoc: 'New Location', editLoc: 'Edit Location', locName: 'Location Name',
      address: 'Address', city: 'City', saving: 'Saving...', btnCreate: 'Create Location', btnSave: 'Save Changes',
      active: 'Active', inactive: 'Inactive', viewAgenda: 'View Agenda', modalSubtitle: 'Complete the branch information'
    }
  }

  const T = T_MAP[lang] || T_MAP['es']

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{T.title}</h1>
          <p className="text-sm text-white/50">{T.subtitle}</p>
        </div>
        <button onClick={() => setShowAddForm(true)}
          className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-primary-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus className="-ml-1 mr-2 h-5 w-5" /> {T.addBtn}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-primary-900/40 border border-white/5 rounded-3xl animate-pulse" />)}
        </div>
      ) : locations.length === 0 ? (
        <div className="py-24 text-center bg-primary-900/20 rounded-3xl border border-dashed border-white/10 shadow-sm">
          <div className="h-20 w-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <MapPin className="h-10 w-10 text-white/20" />
          </div>
          <p className="font-bold text-lg text-white/60">{T.noLocations}</p>
          <button onClick={() => setShowAddForm(true)} className="text-amber-500 font-bold mt-4 hover:text-amber-400 transition-colors">Configurar mi primera sede</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {locations.map(loc => (
            <div key={loc.id} className={`group relative bg-primary-900/40 backdrop-blur-sm rounded-3xl border p-8 transition-all duration-500 overflow-hidden ${savedId === loc.id ? 'border-emerald-500/50 ring-4 ring-emerald-500/10' : 'border-white/5 hover:border-white/20 hover:bg-primary-800/40'}`}>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
              
              <div className="flex items-start justify-between relative z-10 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-500 shadow-inner group-hover:bg-amber-500/10 transition-all duration-500">
                  <Building2 className="h-7 w-7" />
                </div>
                {savedId === loc.id ? (
                  <div className="h-10 w-10 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 animate-in zoom-in-50 duration-300">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                    <button onClick={() => setEditLocation({ ...loc })}
                      className="h-10 w-10 bg-white/5 border border-white/10 text-white/40 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl flex items-center justify-center transition-all">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteLocation(loc.id)}
                      className="h-10 w-10 bg-white/5 border border-white/10 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl flex items-center justify-center transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-4 tracking-tight group-hover:text-amber-500 transition-colors">{loc.name}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Navigation className="h-4 w-4 text-white/30 mt-1 flex-shrink-0" />
                    <p className="text-sm font-medium text-white/50 leading-tight italic">{loc.address || '—'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapIcon className="h-4 w-4 text-white/30 flex-shrink-0" />
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{loc.city || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${loc.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                  {loc.active ? T.active : T.inactive}
                </span>
                <button className="text-[10px] font-bold uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors">{T.viewAgenda} →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAddForm || editLocation) && (() => {
        const isEdit = !!editLocation
        const currentData = isEdit ? editLocation : formData
        const setField = (field: string, value: any) => {
          if (isEdit) setEditLocation(prev => prev ? { ...prev, [field]: value } : null)
          else setFormData(prev => ({ ...prev, [field]: value }))
        }

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => { setShowAddForm(false); setEditLocation(null) }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500" />
            
            <div className="relative bg-primary-950/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300" 
                 onClick={e => e.stopPropagation()}>
              
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{isEdit ? T.editLoc : T.newLoc}</h3>
                    <p className="text-sm text-white/50 mt-1">{T.modalSubtitle}</p>
                  </div>
                  <button onClick={() => { setShowAddForm(false); setEditLocation(null) }} 
                    className="p-2 rounded-full text-white/40 hover:bg-white/10 hover:text-white transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1">{T.locName}</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                      <input autoFocus value={currentData.name}
                        onChange={e => setField('name', e.target.value)}
                        className="w-full rounded-xl bg-white/5 border border-white/10 pl-12 pr-4 py-3 text-white placeholder-white/20 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all font-medium"
                        placeholder="Nombre de la clínica o sede" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1">{T.address}</label>
                    <div className="relative">
                      <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                      <input value={currentData.address}
                        onChange={e => setField('address', e.target.value)}
                        className="w-full rounded-xl bg-white/5 border border-white/10 pl-12 pr-4 py-3 text-white placeholder-white/20 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all font-medium"
                        placeholder="Calle, número, oficina..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1">{T.city}</label>
                    <div className="relative">
                      <MapIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                      <input value={currentData.city}
                        onChange={e => setField('city', e.target.value)}
                        className="w-full rounded-xl bg-white/5 border border-white/10 pl-12 pr-4 py-3 text-white placeholder-white/20 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all font-medium"
                        placeholder="Ciudad o región" />
                    </div>
                  </div>

                  <button
                    onClick={isEdit ? handleEditLocation : handleAddLocation}
                    disabled={saving || !currentData.name}
                    className="w-full py-4 mt-8 rounded-2xl bg-amber-500 text-primary-950 font-bold hover:bg-amber-400 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:hover:scale-100">
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
