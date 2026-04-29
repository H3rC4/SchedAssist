"use client"

import { useEffect, useState } from 'react'
import { 
  Briefcase, Clock, X, Plus, Trash2, Scissors, 
  Stethoscope, Sparkles, DollarSign, Pencil, 
  CheckCircle, ArrowRight, Layers, PlusCircle,
  Loader2, Info
} from 'lucide-react'
import { Language, translations } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { ServicePrecisionCard } from '@/components/dashboard/ServicePrecisionCard'

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price?: number;
  active: boolean;
}

import { useLandingTranslation } from '@/components/LanguageContext'

export default function ServicesPage() {
  const { language: lang, fullT: t } = useLandingTranslation()
  const supabase = createClient()
  const [services, setServices] = useState<Service[]>([])
  const [tenantId, setTenantId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
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
    if (!confirm(lang === 'es' ? '¿Seguro que deseas eliminar este servicio?' : 'Delete this service?')) return
    const res = await fetch(`/api/services?id=${id}&tenant_id=${tenantId}`, { method: 'DELETE' })
    if (res.ok) fetchServices()
  }



  const duration_options = [15, 30, 45, 60, 90, 120]
  const duration_labels: Record<number, string> = { 15: '15m', 30: '30m', 45: '45m', 60: '1h', 90: '1.5h', 120: '2h' }

  return (
    <div className="flex-1 min-h-screen bg-surface p-4 md:p-8 animate-in fade-in duration-1000 overflow-x-hidden">
      
      {/* COMPACT HEADER */}
      <div className="mb-6 md:mb-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1 w-6 bg-primary rounded-full" />
          <p className="text-[8px] font-black text-on-surface-muted uppercase tracking-[0.3em]">
            {t.onboarding.services_title}
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-on-surface tracking-tighter uppercase leading-tight">
              {t.nav_services}
            </h1>
            <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mt-1">
              {t.onboarding.services_desc}
            </p>
          </div>
          
          <button 
            onClick={() => setShowAddForm(true)}
            className="precision-button-primary h-11 px-6 text-[10px] uppercase tracking-widest flex items-center gap-3 shrink-0"
          >
            <span>{t.create.toUpperCase()}</span>
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* SERVICES GRID */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 precision-surface-lowest animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="precision-surface-lowest p-12 text-center max-w-xl mx-auto rounded-3xl">
            <div className="h-16 w-16 bg-surface-container-low rounded-2xl flex items-center justify-center mx-auto mb-6 text-on-surface-muted">
              <Layers className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-black text-on-surface tracking-tight uppercase mb-3">{t.onboarding.services_title_empty}</h2>
            <p className="text-[11px] text-on-surface-muted font-medium mb-8 max-w-xs mx-auto leading-relaxed">
              {t.onboarding.services_desc_empty}
            </p>
            <button 
              onClick={() => setShowAddForm(true)}
              className="precision-button-primary py-2 px-6 text-[10px] tracking-widest uppercase"
            >
              {t.create}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {services.map((service, idx) => (
              <ServicePrecisionCard
                key={service.id}
                service={service}
                index={idx}
                savedId={savedId}
                durationLabels={duration_labels}
                onEdit={setEditService}
                onDelete={handleDeleteService}
              />
            ))}
          </div>
        )}
      </section>

      {/* CONFIGURATION DRAWER */}
      <AnimatePresence>
        {(showAddForm || editService) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end p-0 md:p-6 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowAddForm(false); setEditService(null) }}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-md"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 35, stiffness: 350 }}
              className="relative h-full w-full max-w-2xl precision-surface-lowest md:rounded-[4rem] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex items-start justify-between mb-8">
                  <div className="space-y-2">
                    <div className="h-1 w-8 bg-primary rounded-full" />
                    <p className="text-[8px] font-black text-on-surface-muted uppercase tracking-[0.3em]">{t.operational_intelligence.toUpperCase()}</p>
                    <h2 className="text-xl font-black text-on-surface tracking-tighter uppercase leading-none">
                      {editService ? t.edit : t.create} <br /> 
                      <span className="text-primary">{t.service}</span>
                    </h2>
                  </div>
                  <button 
                    onClick={() => { setShowAddForm(false); setEditService(null) }} 
                    className="h-9 w-9 flex items-center justify-center bg-surface-container-low rounded-full hover:bg-surface-container-highest transition-colors"
                  >
                    <X className="h-4 w-4 text-on-surface-muted" />
                  </button>
                </div>

                <div className="space-y-10">
                  {/* NAME INPUT */}
                  <div className="space-y-4">
                    <label className="text-[8px] font-black text-on-surface-muted uppercase tracking-[0.3em] ml-1">{t.onboarding.service_name}</label>
                    <input 
                      autoFocus
                      value={editService ? editService.name : formData.name}
                      onChange={e => editService ? setEditService({...editService, name: e.target.value}) : setFormData({...formData, name: e.target.value})}
                      className="w-full text-xl font-black text-on-surface bg-transparent border-none focus:ring-0 placeholder:text-surface-container-highest p-0 uppercase tracking-tighter"
                      placeholder={t.onboarding.service_name} 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* DURATION SELECT */}
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-on-surface-muted uppercase tracking-[0.3em] ml-1">{t.onboarding.duration}</label>
                      <div className="relative">
                        <select 
                          value={editService ? editService.duration_minutes : formData.duration_minutes}
                          onChange={e => editService ? setEditService({...editService, duration_minutes: parseInt(e.target.value)}) : setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                          className="w-full h-11 bg-surface-container-low border-2 border-transparent rounded-xl px-4 font-bold text-on-surface text-sm focus:bg-surface-container-lowest focus:border-primary transition-all appearance-none outline-none shadow-inner"
                        >
                          {duration_options.map(d => <option key={d} value={d}>{duration_labels[d]}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <Clock className="h-4 w-4 text-on-surface-muted" />
                        </div>
                      </div>
                    </div>

                    {/* PRICE INPUT */}
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-on-surface-muted uppercase tracking-[0.3em] ml-1">{t.onboarding.price}</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary/40 text-base">$</div>
                        <input 
                          type="number"
                          value={editService ? editService.price : formData.price}
                          onChange={e => editService ? setEditService({...editService, price: parseFloat(e.target.value)}) : setFormData({...formData, price: parseFloat(e.target.value)})}
                          className="w-full h-11 bg-surface-container-low border-2 border-transparent rounded-xl pl-10 pr-4 font-bold text-on-surface text-sm focus:bg-surface-container-lowest focus:border-primary transition-all shadow-inner outline-none"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-secondary-container rounded-2xl flex gap-4 items-start">
                    <div className="h-8 w-8 bg-surface-container-lowest rounded-xl flex items-center justify-center text-secondary shadow-sm shrink-0">
                      <Info className="h-4 w-4" />
                    </div>
                    <p className="text-[11px] font-medium text-on-secondary-container leading-relaxed">
                      {lang === 'es' ? 'La duración seleccionada determina los intervalos disponibles en el calendario.' : lang === 'it' ? 'La durata selezionata determina gli intervalli disponibili nel calendario.' : 'The selected duration determines the available slots in the calendar.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 pt-0">
                <button 
                  onClick={editService ? handleEditService : handleAddService}
                  disabled={saving || (editService ? !editService.name : !formData.name)}
                  className="w-full h-12 bg-primary hover:brightness-110 disabled:opacity-30 transition-all text-white rounded-xl text-[9px] font-black uppercase tracking-[0.3em] shadow-sm flex items-center justify-center gap-3 active:scale-95"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editService ? t.save_changes : t.create}
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
