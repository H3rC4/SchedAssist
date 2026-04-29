"use client"

import { useState } from 'react'
import { X, Calendar, User, Phone, Stethoscope, Briefcase, CheckCircle, Clock, ChevronRight, Search } from 'lucide-react'
import { format } from 'date-fns'
import { PatientSearch } from './PatientSearch'
import { Client } from '@/hooks/useAppointments'
import { motion, AnimatePresence } from 'framer-motion'

interface NewAppointmentModalProps {
  tenantId: string;
  lang: 'en' | 'es' | 'it';
  services: any[];
  professionals: any[];
  onClose: () => void;
  onSuccess: () => void;
  selectedDate: Date;
  translations: any;
  availableSlots: string[];
  slotLoading: boolean;
  onFetchSlots: (profId: string, date: string) => void;
}

export function NewAppointmentModal({
  tenantId,
  lang,
  services,
  professionals,
  onClose,
  onSuccess,
  selectedDate,
  translations: T,
  availableSlots,
  slotLoading,
  onFetchSlots
}: NewAppointmentModalProps) {
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', phone: '', service_id: '', professional_id: '',
    date: format(selectedDate, 'yyyy-MM-dd'), time: '', notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSelectPatient = (client: Client) => {
    setFormData(prev => ({
      ...prev,
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone,
    }))
  }

  const handleCreateAppointment = async () => {
    setLoading(true)
    const { date, time } = formData
    const start_at = `${date}T${time}:00Z`
    const duration = 30 
    const end_at = new Date(new Date(start_at).getTime() + duration * 60000).toISOString()

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, ...formData, start_at, end_at })
      })

      if (res.ok) {
        setSaveSuccess(true)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1000)
      } else {
        const err = await res.json()
        alert(err.error || T.errGeneric)
      }
    } catch (e) {
      alert(T.errGeneric)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-on-surface/20 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-2xl bg-surface h-full shadow-spatial p-12 md:p-20 overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-12 right-12 p-4 bg-on-surface/5 rounded-full hover:bg-on-surface/10 transition-all group"
        >
          <X className="h-6 w-6 text-on-surface group-hover:rotate-90 transition-transform" />
        </button>

        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
             <div className="h-2 w-2 rounded-full bg-primary" />
             <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.4em]">Resource Registration</p>
          </div>
          
          <h2 className="precision-header">
            {T.modalTitle.split(' ')[0]} <br />
            <span className="text-primary italic font-medium">{T.modalTitle.split(' ').slice(1).join(' ')}</span>
          </h2>
        </div>

        <div className="space-y-12">
          {/* Section: Patient Identity */}
          <div className="space-y-8">
             <div className="flex items-center gap-4">
                <Search className="h-4 w-4 text-primary" />
                <p className="text-[10px] font-black text-on-surface uppercase tracking-[0.2em]">{T.searchPatient}</p>
             </div>
             <PatientSearch tenantId={tenantId} lang={lang} onSelect={handleSelectPatient} translations={T} />
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-on-surface/20 uppercase tracking-widest ml-4">{T.nameLabel}</label>
                  <input 
                    value={formData.first_name} 
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full bg-on-surface/5 border border-on-surface/5 rounded-3xl px-8 py-5 text-sm font-black text-on-surface focus:bg-white focus:border-primary/20 transition-all outline-none"
                    placeholder={lang === 'it' ? 'Mario' : (lang === 'es' ? 'Ignacio' : 'John')} 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-on-surface/20 uppercase tracking-widest ml-4">{T.lastNameLabel}</label>
                  <input 
                    value={formData.last_name} 
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full bg-on-surface/5 border border-on-surface/5 rounded-3xl px-8 py-5 text-sm font-black text-on-surface focus:bg-white focus:border-primary/20 transition-all outline-none"
                    placeholder={lang === 'it' ? 'Rossi' : (lang === 'es' ? 'Castro' : 'Doe')} 
                  />
                </div>
             </div>
             
             <div className="space-y-3">
                <label className="text-[10px] font-black text-on-surface/20 uppercase tracking-widest ml-4">{T.phoneLabel}</label>
                <input 
                  value={formData.phone} 
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-on-surface/5 border border-on-surface/5 rounded-3xl px-8 py-5 text-sm font-black text-on-surface focus:bg-white focus:border-primary/20 transition-all outline-none"
                  placeholder="+39 333 123 4567" 
                />
             </div>
          </div>

          {/* Section: Configuration */}
          <div className="space-y-8 pt-12 border-t border-on-surface/10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-on-surface/20 uppercase tracking-widest ml-4">{T.serviceLabel}</label>
                  <select 
                    value={formData.service_id}
                    onChange={e => setFormData({ ...formData, service_id: e.target.value })}
                    className="w-full bg-on-surface/5 border border-on-surface/5 rounded-3xl px-8 py-5 text-sm font-black text-on-surface focus:bg-white focus:border-primary/20 transition-all outline-none appearance-none"
                  >
                    <option value="">{T.selectOption}</option>
                    {services.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-on-surface/20 uppercase tracking-widest ml-4">{T.profLabel}</label>
                  <select 
                    value={formData.professional_id}
                    onChange={e => {
                      const profId = e.target.value
                      setFormData({ ...formData, professional_id: profId, time: '' })
                      if (profId) onFetchSlots(profId, formData.date)
                    }}
                    className="w-full bg-on-surface/5 border border-on-surface/5 rounded-3xl px-8 py-5 text-sm font-black text-on-surface focus:bg-white focus:border-primary/20 transition-all outline-none appearance-none"
                  >
                    <option value="">{T.selectOption}</option>
                    {professionals.map(o => <option key={o.id} value={o.id}>{o.full_name}</option>)}
                  </select>
                </div>
             </div>

             <div className="space-y-3">
                <label className="text-[10px] font-black text-on-surface/20 uppercase tracking-widest ml-4">{T.whenLabel}</label>
                <input 
                  type="date" 
                  min={format(new Date(), 'yyyy-MM-dd')} 
                  value={formData.date}
                  onChange={e => {
                    const newDate = e.target.value
                    setFormData({ ...formData, date: newDate, time: '' })
                    if (formData.professional_id) onFetchSlots(formData.professional_id, newDate)
                  }}
                  className="w-full bg-primary/5 border border-primary/10 rounded-3xl px-8 py-5 text-sm font-black text-primary transition-all outline-none" 
                />
             </div>
          </div>

          {/* Section: Slot Selection */}
          <AnimatePresence>
            {formData.professional_id && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 pt-12 border-t border-on-surface/10 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.3em]">{T.slotsLabel}</label>
                  {slotLoading && <Clock className="h-4 w-4 text-primary animate-spin" />}
                </div>
                
                {availableSlots.length === 0 && !slotLoading ? (
                  <div className="p-10 rounded-[3rem] border border-warning/20 bg-warning/5 text-center">
                    <p className="text-xs font-black text-warning uppercase tracking-widest">{T.noSlots}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {availableSlots.map(slot => (
                      <button 
                        key={slot} 
                        type="button" 
                        onClick={() => setFormData({ ...formData, time: slot })}
                        className={`py-4 rounded-2xl text-[10px] font-black transition-all border
                          ${formData.time === slot ? 'bg-primary text-white border-primary shadow-spatial' : 'bg-on-surface/5 border-transparent text-on-surface hover:border-primary/20'}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-12 border-t border-on-surface/10">
            <button 
              onClick={handleCreateAppointment}
              disabled={loading || saveSuccess || !formData.first_name || !formData.professional_id || !formData.time}
              className={`w-full py-8 rounded-full font-black text-[10px] uppercase tracking-[0.4em] shadow-spatial transition-all duration-500 flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                ${saveSuccess ? 'bg-success text-white' : 'bg-primary text-white hover:bg-on-surface'}`}
            >
              {saveSuccess ? (
                <><CheckCircle className="h-5 w-5" /> {T.ready || 'DONE!'}</>
              ) : loading ? (
                <><Clock className="h-5 w-5 animate-spin" /> {T.reserving}</>
              ) : (
                <>{T.confirm} <ChevronRight className="h-5 w-5" /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
