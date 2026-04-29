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

  const t = translations[lang] || translations['en']

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
    if (!confirm(lang === 'es' ? '¿Seguro que deseas eliminar este servicio?' : 'Delete this service?')) return
    const res = await fetch(`/api/services?id=${id}&tenant_id=${tenantId}`, { method: 'DELETE' })
    if (res.ok) fetchServices()
  }



  const duration_options = [15, 30, 45, 60, 90, 120]
  const duration_labels: Record<number, string> = { 15: '15m', 30: '30m', 45: '45m', 60: '1h', 90: '1.5h', 120: '2h' }

  return (
    <div className="flex-1 min-h-screen bg-surface p-4 md:p-6 animate-in fade-in duration-1000 overflow-x-hidden">
      
      {/* MASSIVE EDITORIAL HEADER */}
      <div className="mb-8 md:mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-1.5 w-8 bg-primary rounded-full" />
          <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-[0.4em]">
            CATÁLOGO OPERATIVO
          </p>
        </div>
        <h1 className="precision-header text-3xl md:text-4xl uppercase break-words">
          SERVICIOS
        </h1>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mt-8">
          <p className="text-sm font-medium text-on-surface-muted max-w-2xl leading-relaxed">
            Define los procedimientos clínicos y estéticos de tu centro con precisión atómica. Controla duraciones, precios y disponibilidad.
          </p>
          <button 
            onClick={() => setShowAddForm(true)}
            className="precision-button-primary h-12 md:h-13 shrink-0 flex items-center gap-4"
          >
            <span className="text-[10px] tracking-[0.3em] uppercase font-black">REGISTRAR SERVICIO</span>
            <Plus className="h-5 w-5" />
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
          <div className="precision-surface-lowest p-20 text-center max-w-4xl mx-auto">
            <div className="h-32 w-32 bg-surface-container-low rounded-[3rem] flex items-center justify-center mx-auto mb-10 text-on-surface-muted">
              <Layers className="h-16 w-16" />
            </div>
            <h2 className="text-4xl font-black text-on-surface tracking-tight uppercase mb-6">SIN SERVICIOS DEFINIDOS</h2>
            <p className="text-on-surface-muted font-medium mb-12 max-w-md mx-auto leading-relaxed">
              Comienza a construir tu catálogo operativo agregando tu primer servicio clínico o estético.
            </p>
            <button 
              onClick={() => setShowAddForm(true)}
              className="precision-button-primary text-[10px] tracking-widest"
            >
              CREAR PRIMER SERVICIO
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
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
              <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex items-start justify-between mb-12">
                  <div className="space-y-3">
                    <div className="h-1.5 w-10 bg-primary rounded-full" />
                    <p className="text-[9px] font-black text-on-surface-muted uppercase tracking-[0.4em]">SISTEMA DE SERVICIOS</p>
                    <h2 className="text-3xl font-black text-on-surface tracking-tighter uppercase leading-[0.9]">
                      {editService ? 'ACTUALIZAR' : 'DEFINIR'} <br /> 
                      <span className="text-primary">PROCEDIMIENTO</span>
                    </h2>
                  </div>
                  <button 
                    onClick={() => { setShowAddForm(false); setEditService(null) }} 
                    className="h-12 w-12 flex items-center justify-center bg-surface-container-low rounded-full hover:bg-surface-container-highest transition-colors"
                  >
                    <X className="h-6 w-6 text-on-surface-muted" />
                  </button>
                </div>

                <div className="space-y-16">
                  {/* NAME INPUT */}
                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-[0.3em] ml-2">NOMBRE DEL SERVICIO</label>
                    <input 
                      autoFocus
                      value={editService ? editService.name : formData.name}
                      onChange={e => editService ? setEditService({...editService, name: e.target.value}) : setFormData({...formData, name: e.target.value})}
                      className="w-full text-3xl font-black text-on-surface bg-transparent border-none focus:ring-0 placeholder:text-surface-container-highest p-0 uppercase tracking-tighter"
                      placeholder="EJ: LIMPIEZA FACIAL" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* DURATION SELECT */}
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-on-surface-muted uppercase tracking-[0.3em] ml-2">DURACIÓN ESTIMADA</label>
                      <div className="relative">
                        <select 
                          value={editService ? editService.duration_minutes : formData.duration_minutes}
                          onChange={e => editService ? setEditService({...editService, duration_minutes: parseInt(e.target.value)}) : setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                          className="w-full h-14 bg-surface-container-low border-2 border-transparent rounded-2xl px-6 font-black text-on-surface text-lg focus:bg-surface-container-lowest focus:border-primary transition-all appearance-none outline-none shadow-inner"
                        >
                          {duration_options.map(d => <option key={d} value={d}>{duration_labels[d]}</option>)}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                          <Clock className="h-5 w-5 text-on-surface-muted" />
                        </div>
                      </div>
                    </div>

                    {/* PRICE INPUT */}
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-on-surface-muted uppercase tracking-[0.3em] ml-2">VALOR BASE (ARS)</label>
                      <div className="relative">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-primary/40 text-xl">$</div>
                        <input 
                          type="number"
                          value={editService ? editService.price : formData.price}
                          onChange={e => editService ? setEditService({...editService, price: parseFloat(e.target.value)}) : setFormData({...formData, price: parseFloat(e.target.value)})}
                          className="w-full h-14 bg-surface-container-low border-2 border-transparent rounded-2xl pl-14 pr-6 font-black text-on-surface text-lg focus:bg-surface-container-lowest focus:border-primary transition-all shadow-inner outline-none"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-secondary-container rounded-3xl flex gap-6 items-start">
                    <div className="h-12 w-12 bg-surface-container-lowest rounded-2xl flex items-center justify-center text-secondary shadow-ambient shrink-0">
                      <Info className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-on-secondary-container leading-relaxed">
                      La duración seleccionada determina los intervalos disponibles en el calendario de reservas para este servicio.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-12 pt-0">
                <button 
                  onClick={editService ? handleEditService : handleAddService}
                  disabled={saving || (editService ? !editService.name : !formData.name)}
                  className="w-full h-16 bg-primary hover:brightness-110 disabled:opacity-30 transition-all text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-spatial flex items-center justify-center gap-4 active:scale-95"
                >
                  {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : editService ? 'GUARDAR CAMBIOS' : 'INICIALIZAR SERVICIO'}
                  <CheckCircle className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
