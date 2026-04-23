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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{T.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{T.subtitle}</p>
        </div>
        <button onClick={() => setShowAddForm(true)}
          className="inline-flex items-center justify-center rounded-2xl bg-primary-600 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all">
          <Plus className="-ml-1 mr-2 h-5 w-5" /> {T.addBtn}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] animate-pulse" />)}
        </div>
      ) : locations.length === 0 ? (
        <div className="py-24 text-center bg-white dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-white/5 shadow-sm">
          <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <MapPin className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="font-bold text-xl text-slate-400 dark:text-slate-500">{T.noLocations}</p>
          <button onClick={() => setShowAddForm(true)} className="text-primary-500 font-black mt-4 hover:underline text-sm uppercase tracking-widest">Configurar mi primera sede</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {locations.map(loc => (
            <div key={loc.id} className={`group relative bg-white dark:bg-slate-900 rounded-[2.5rem] border p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden ${savedId === loc.id ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-slate-100 dark:border-white/5'}`}>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
              
              <div className="flex items-start justify-between relative z-10 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all duration-500">
                  <Building2 className="h-7 w-7" />
                </div>
                {savedId === loc.id ? (
                  <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white animate-in zoom-in-50 duration-300">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                    <button onClick={() => setEditLocation({ ...loc })}
                      className="h-10 w-10 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-500 rounded-xl flex items-center justify-center transition-all">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteLocation(loc.id)}
                      className="h-10 w-10 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-xl flex items-center justify-center transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 tracking-tight group-hover:text-primary-500 transition-colors">{loc.name}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Navigation className="h-4 w-4 text-slate-300 dark:text-slate-600 mt-1 flex-shrink-0" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-tight italic">{loc.address || '—'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapIcon className="h-4 w-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{loc.city || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between relative z-10">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${loc.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                  {loc.active ? T.active : T.inactive}
                </span>
                <button className="text-xs font-bold text-primary-500 hover:underline">{T.viewAgenda} →</button>
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
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-500" />
            
            <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300" 
                 onClick={e => e.stopPropagation()}>
              
              <div className="h-2 bg-primary-600" />
              
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{isEdit ? T.editLoc : T.newLoc}</h3>
                    <p className="text-sm text-slate-400 font-medium">{T.modalSubtitle}</p>
                  </div>
                  <button onClick={() => { setShowAddForm(false); setEditLocation(null) }} 
                    className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{T.locName}</label>
                    <div className="relative">
                      <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                      <input autoFocus value={currentData.name}
                        onChange={e => setField('name', e.target.value)}
                        className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border-none pl-14 pr-6 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all font-bold"
                        placeholder="Nombre de la clínica o sede" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{T.address}</label>
                    <div className="relative">
                      <Navigation className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                      <input value={currentData.address}
                        onChange={e => setField('address', e.target.value)}
                        className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border-none pl-14 pr-6 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all font-bold"
                        placeholder="Calle, número, oficina..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{T.city}</label>
                    <div className="relative">
                      <MapIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                      <input value={currentData.city}
                        onChange={e => setField('city', e.target.value)}
                        className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border-none pl-14 pr-6 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all font-bold"
                        placeholder="Ciudad o región" />
                    </div>
                  </div>

                  <button
                    onClick={isEdit ? handleEditLocation : handleAddLocation}
                    disabled={saving || !currentData.name}
                    className="w-full py-5 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50 mt-4">
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
