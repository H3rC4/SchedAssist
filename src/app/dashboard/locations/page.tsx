"use client"

import { useEffect, useState } from 'react'
import { 
  Plus, CheckCircle, X, 
  Globe, Navigation, ArrowRight
} from 'lucide-react'
import { Language } from '@/lib/i18n'
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
    if (!confirm('¿Seguro que deseas eliminar esta sede?')) return
    const res = await fetch(`/api/locations?id=${id}&tenant_id=${tenantId}`, { method: 'DELETE' })
    if (res.ok) fetchLocations()
  }

  return (
    <div className="min-h-full bg-surface py-editorial-tight md:py-editorial overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto px-6 md:px-editorial">
        
        {/* Editorial Header */}
        <header className="mb-20 md:mb-32">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-6">Global Presence</p>
            <h1 className="precision-header max-w-4xl">
              Precision <br />
              <span className="text-primary/20 italic font-medium">Locations</span>
            </h1>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mt-12">
               <p className="precision-subheader max-w-lg">
                 Strategically manage your physical reach and patient touchpoints.
               </p>
               <button 
                 onClick={() => setShowAddForm(true)}
                 className="precision-button-primary self-start group flex items-center gap-4"
               >
                 <span>Add Location</span>
                 <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </motion.div>
        </header>

        {/* Locations Grid */}
        <section className="asymmetric-layout">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {[1, 2].map(i => <div key={i} className="h-80 bg-surface-container-low rounded-5xl animate-pulse" />)}
            </div>
          ) : locations.length === 0 ? (
            <div className="precision-surface-lowest p-20 text-center rounded-5xl">
              <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-ambient">
                <Globe className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-3xl font-black text-on-surface mb-4 uppercase tracking-tight">No locations mapped</h2>
              <p className="text-on-surface-muted font-medium mb-10 max-w-md mx-auto leading-relaxed">
                Connect your physical clinics to the digital scheduling ecosystem.
              </p>
              <button onClick={() => setShowAddForm(true)} className="precision-button-tonal">
                Map First Location
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {locations.map((loc, idx) => (
                <LocationPrecisionCard
                  key={loc.id}
                  location={loc}
                  index={idx}
                  savedId={savedId}
                  onEdit={setEditLocation}
                  onDelete={handleDeleteLocation}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Precision Drawer (Add/Edit) */}
      <AnimatePresence>
        {(showAddForm || editLocation) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end p-0 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowAddForm(false); setEditLocation(null) }}
              className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative h-full w-full max-w-2xl bg-surface-container-lowest shadow-spatial md:rounded-5xl flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-12 md:p-20 overflow-y-auto custom-scrollbar flex-1">
                 <div className="flex items-center justify-between mb-20">
                    <div>
                       <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Spatial Mapping</p>
                       <h2 className="precision-header text-5xl mb-0">{editLocation ? 'Update' : 'Define'} Location</h2>
                    </div>
                    <button onClick={() => { setShowAddForm(false); setEditLocation(null) }} className="p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container-highest transition-colors text-on-surface-muted hover:text-on-surface">
                       <X className="h-8 w-8" />
                    </button>
                 </div>

                 <div className="space-y-12">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-[0.3em] ml-2">Center Name</label>
                       <input 
                         autoFocus
                         value={editLocation ? editLocation.name : formData.name}
                         onChange={e => editLocation ? setEditLocation({...editLocation, name: e.target.value}) : setFormData({...formData, name: e.target.value})}
                         className="w-full text-4xl font-black text-on-surface bg-transparent border-none focus:ring-0 placeholder:text-on-surface-muted p-0 uppercase"
                         placeholder="Branch identifier..." 
                       />
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-[0.3em] ml-2">Geographic Address</label>
                       <input 
                         value={editLocation ? editLocation.address : formData.address}
                         onChange={e => editLocation ? setEditLocation({...editLocation, address: e.target.value}) : setFormData({...formData, address: e.target.value})}
                         className="w-full text-2xl font-bold text-on-surface bg-transparent border-none focus:ring-0 placeholder:text-on-surface-muted p-0"
                         placeholder="Street, number, unit..." 
                       />
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-[0.3em] ml-2">City / Region</label>
                       <input 
                         value={editLocation ? editLocation.city : formData.city}
                         onChange={e => editLocation ? setEditLocation({...editLocation, city: e.target.value}) : setFormData({...formData, city: e.target.value})}
                         className="w-full text-2xl font-bold text-on-surface bg-transparent border-none focus:ring-0 placeholder:text-on-surface-muted p-0"
                         placeholder="Location city..." 
                       />
                    </div>

                    {editLocation && (
                      <div className="flex items-center gap-6 p-8 bg-surface-container-low rounded-3xl">
                         <div className="flex-1">
                            <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-[0.2em] mb-2">Operation Status</p>
                            <p className="text-sm font-bold text-on-surface">Enable patients to book at this location</p>
                         </div>
                         <button 
                           onClick={() => setEditLocation({...editLocation, active: !editLocation.active})}
                           className={`h-10 w-16 rounded-full transition-all flex items-center p-1.5 ${editLocation.active ? 'bg-primary justify-end' : 'bg-surface-container-highest justify-start'}`}
                         >
                            <div className="h-7 w-7 bg-white rounded-full shadow-sm" />
                         </button>
                      </div>
                    )}
                 </div>
              </div>

              <div className="p-12 md:p-20 pt-0">
                 <button 
                   onClick={editLocation ? handleEditLocation : handleAddLocation}
                   disabled={saving || (editLocation ? !editLocation.name : !formData.name)}
                   className="precision-button-primary w-full text-lg py-6 flex items-center justify-center gap-4 disabled:opacity-30 disabled:cursor-not-allowed"
                 >
                    {saving ? 'Mapping...' : editLocation ? 'Update Coordinates' : 'Establish Location'}
                    <CheckCircle className="h-6 w-6" />
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

