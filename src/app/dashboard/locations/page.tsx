"use client"

import { useEffect, useState } from 'react'
import { 
  Plus, CheckCircle, X, 
  Globe, Navigation, ArrowRight
} from 'lucide-react'
import { Language, translations } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { LocationPrecisionCard } from '@/components/dashboard/LocationPrecisionCard'

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
    if (!confirm(t.confirm_delete_location || '¿Seguro que deseas eliminar esta sede?')) return
    const res = await fetch(`/api/locations?id=${id}&tenant_id=${tenantId}`, { method: 'DELETE' })
    if (res.ok) fetchLocations()
  }

  const t = translations[lang] || translations['en']

  return (
    <div className="min-h-full bg-surface pb-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8">
        
        {/* Compact Header */}
        <header className="py-12 md:py-16">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.4em]">{t.global_presence || 'Global Presence'}</p>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
               <div>
                  <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tight leading-none mb-4">
                    {t.nav_locations || 'Locations'} <br />
                    <span className="text-primary italic font-serif lowercase">{t.management || 'management'}</span>
                  </h1>
                  <p className="text-xs font-bold text-on-surface/40 uppercase tracking-widest max-w-lg leading-relaxed">
                    {t.locations_subtitle || 'Strategically manage your physical reach and patient touchpoints.'}
                  </p>
               </div>
               <button 
                 onClick={() => setShowAddForm(true)}
                 className="bg-primary text-white px-8 py-4 rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center gap-3"
               >
                 {t.add_location || 'Add Location'}
                 <Plus className="h-4 w-4" />
               </button>
            </div>
          </motion.div>
        </header>

        {/* Locations Grid */}
        <section>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-64 bg-on-surface/5 rounded-3xl animate-pulse" />)}
            </div>
          ) : locations.length === 0 ? (
            <div className="bg-on-surface/5 border border-dashed border-on-surface/10 p-20 text-center rounded-3xl">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-black text-on-surface mb-2 uppercase tracking-tight">{t.no_locations_found || 'No locations mapped'}</h2>
              <p className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-8 max-w-xs mx-auto leading-relaxed">
                {t.locations_empty_desc || 'Connect your physical clinics to the digital scheduling ecosystem.'}
              </p>
              <button onClick={() => setShowAddForm(true)} className="text-[10px] font-black text-primary uppercase tracking-[0.3em] hover:underline">
                {t.map_first_location || 'Map First Location'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((loc, idx) => (
                <LocationPrecisionCard
                  key={loc.id}
                  location={loc}
                  index={idx}
                  savedId={savedId}
                  onEdit={setEditLocation}
                  onDelete={handleDeleteLocation}
                  t={t}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modern Drawer (Add/Edit) */}
      <AnimatePresence>
        {(showAddForm || editLocation) && (
          <div className="fixed inset-0 z-[110] flex justify-end" onClick={() => { setShowAddForm(false); setEditLocation(null) }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative h-full w-full max-w-md bg-surface shadow-2xl flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="p-8 pb-0 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black tracking-[0.4em] text-on-surface/40 uppercase">
                      {t.spatial_mapping || 'Spatial Mapping'}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-on-surface tracking-tight leading-tight">
                    {editLocation ? (t.update || 'Update') : (t.create || 'Define')} <br />
                    <span className="text-primary italic font-serif lowercase">{t.location || 'Location'}</span>
                  </h2>
                </div>
                <button 
                  onClick={() => { setShowAddForm(false); setEditLocation(null) }} 
                  className="p-3 hover:bg-on-surface/5 rounded-full transition-colors group"
                >
                  <X className="h-5 w-5 text-on-surface/40 group-hover:text-on-surface transition-colors" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">{t.center_name || 'Center Name'}</label>
                    <input 
                      autoFocus
                      value={editLocation ? editLocation.name : formData.name}
                      onChange={e => editLocation ? setEditLocation({...editLocation, name: e.target.value}) : setFormData({...formData, name: e.target.value})}
                      className="w-full bg-on-surface/5 border-none rounded-2xl px-6 py-4 text-sm font-bold text-on-surface focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      placeholder={t.branch_identifier_ph || "Branch identifier..."} 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">{t.geographic_address || 'Geographic Address'}</label>
                    <input 
                      value={editLocation ? editLocation.address : formData.address}
                      onChange={e => editLocation ? setEditLocation({...editLocation, address: e.target.value}) : setFormData({...formData, address: e.target.value})}
                      className="w-full bg-on-surface/5 border-none rounded-2xl px-6 py-4 text-sm font-bold text-on-surface focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      placeholder={t.geographic_address_ph || "Street, number, unit..."} 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">{t.city_region || 'City / Region'}</label>
                    <input 
                      value={editLocation ? editLocation.city : formData.city}
                      onChange={e => editLocation ? setEditLocation({...editLocation, city: e.target.value}) : setFormData({...formData, city: e.target.value})}
                      className="w-full bg-on-surface/5 border-none rounded-2xl px-6 py-4 text-sm font-bold text-on-surface focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      placeholder={t.location_city_ph || "Location city..."} 
                    />
                  </div>

                  {editLocation && (
                    <div className="flex items-center gap-6 p-6 bg-on-surface/5 rounded-3xl border border-on-surface/5">
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-1">{t.operation_status || 'Operation Status'}</p>
                          <p className="text-[11px] font-bold text-on-surface/60 leading-tight">{t.enable_booking_desc || 'Enable patients to book at this location'}</p>
                       </div>
                       <button 
                         onClick={() => setEditLocation({...editLocation, active: !editLocation.active})}
                         className={`h-7 w-12 rounded-full transition-all flex items-center p-1 ${editLocation.active ? 'bg-primary justify-end' : 'bg-on-surface/20 justify-start'}`}
                       >
                          <div className="h-5 w-5 bg-white rounded-full shadow-sm" />
                       </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-8 border-t border-on-surface/5 bg-surface/80 backdrop-blur-md">
                <button 
                  onClick={editLocation ? handleEditLocation : handleAddLocation}
                  disabled={saving || (editLocation ? !editLocation.name : !formData.name)}
                  className="w-full py-5 rounded-full bg-primary text-white font-black text-[11px] uppercase tracking-[0.4em] shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {saving ? (t.mapping_loading || 'Mapping...') : editLocation ? (t.update_coordinates || 'Update Coordinates') : (t.establish_location || 'Establish Location')}
                  <CheckCircle className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

