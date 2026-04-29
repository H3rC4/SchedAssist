"use client"

import { useState, useEffect } from 'react'
import { X, CheckCircle, Clock, ChevronRight, User, Stethoscope, Briefcase, Calendar as CalendarIcon, Hash, Phone, FileText } from 'lucide-react'
import { format, addMinutes } from 'date-fns'
import { PatientSearch } from './PatientSearch'
import { Client } from '@/hooks/useAppointments'
import { motion, AnimatePresence } from 'framer-motion'

interface QuickAppointmentDrawerProps {
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

export function QuickAppointmentDrawer({
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
}: QuickAppointmentDrawerProps) {
  const [formData, setFormData] = useState({
    first_name: '', 
    last_name: '', 
    phone: '', 
    service_id: '', 
    professional_id: '',
    date: format(selectedDate, 'yyyy-MM-dd'), 
    time: '', 
    notes: ''
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
    if (!formData.first_name || !formData.professional_id || !formData.time || !formData.service_id) return

    setLoading(true)
    const { date, time } = formData
    
    // Calculate end_at based on service duration (default 30m if not found)
    const service = services.find(s => s.id === formData.service_id)
    const duration = service?.duration || 30
    
    const start_at = `${date}T${time}:00Z`
    const end_at = addMinutes(new Date(start_at), duration).toISOString()

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tenant_id: tenantId, 
          ...formData, 
          start_at, 
          end_at 
        })
      })

      if (res.ok) {
        setSaveSuccess(true)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1200)
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

  // Auto-fetch slots when professional or date changes
  useEffect(() => {
    if (formData.professional_id && formData.date) {
      onFetchSlots(formData.professional_id, formData.date)
    }
  }, [formData.professional_id, formData.date, onFetchSlots])

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" onClick={onClose}>
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
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-xl bg-surface h-full shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Editorial Header */}
        <div className="p-8 md:p-12 pb-0 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.4em] text-on-surface/40 uppercase">
                {T.quick_appointment}
              </span>
            </div>
            <h2 className="precision-header text-4xl leading-tight">
              {T.create_appointment?.split(' ')[0] || 'Schedule'} <br />
              <span className="text-primary italic font-serif">
                {T.create_appointment?.split(' ').slice(1).join(' ') || 'Appointment'}
              </span>
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-on-surface/5 rounded-full hover:bg-on-surface/10 transition-colors group"
          >
            <X className="h-5 w-5 text-on-surface/40 group-hover:text-on-surface group-hover:rotate-90 transition-all" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12">
          {/* Patient Selection & Data */}
          <section className="space-y-8">
            <div className="flex items-center gap-4 border-b border-on-surface/5 pb-4">
              <User className="h-4 w-4 text-primary" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">
                {T.patient_search}
              </h3>
            </div>
            
            <PatientSearch 
              tenantId={tenantId} 
              lang={lang} 
              onSelect={handleSelectPatient} 
              translations={T} 
            />

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">{T.name}</label>
                <input 
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="e.g. John"
                  className="w-full bg-on-surface/5 border-none rounded-2xl px-6 py-4 text-sm font-bold text-on-surface focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">{T.last_name}</label>
                <input 
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="e.g. Doe"
                  className="w-full bg-on-surface/5 border-none rounded-2xl px-6 py-4 text-sm font-bold text-on-surface focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">{T.phone}</label>
              <div className="relative">
                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface/20" />
                <input 
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+39 333 123 4567"
                  className="w-full bg-on-surface/5 border-none rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-on-surface focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>
          </section>

          {/* Service & Professional */}
          <section className="space-y-8">
            <div className="flex items-center gap-4 border-b border-on-surface/5 pb-4">
              <Briefcase className="h-4 w-4 text-primary" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">
                {T.service_type}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">{T.service}</label>
                <select 
                  value={formData.service_id}
                  onChange={e => setFormData({ ...formData, service_id: e.target.value })}
                  className="w-full bg-on-surface/5 border-none rounded-2xl px-6 py-4 text-sm font-bold text-on-surface focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                >
                  <option value="">{T.selectOption || 'Select...'}</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">{T.professional}</label>
                <select 
                  value={formData.professional_id}
                  onChange={e => setFormData({ ...formData, professional_id: e.target.value, time: '' })}
                  className="w-full bg-on-surface/5 border-none rounded-2xl px-6 py-4 text-sm font-bold text-on-surface focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                >
                  <option value="">{T.selectOption || 'Select...'}</option>
                  {professionals.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Date & Time Picker */}
          <section className="space-y-8">
            <div className="flex items-center gap-4 border-b border-on-surface/5 pb-4">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">
                {T.when}
              </h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">{T.date}</label>
                <input 
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value, time: '' })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full bg-primary/5 border border-primary/10 rounded-2xl px-6 py-4 text-sm font-black text-primary transition-all outline-none"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest">{T.time}</label>
                  {slotLoading && <Clock className="h-3 w-3 text-primary animate-spin" />}
                </div>

                {!formData.professional_id ? (
                  <div className="p-8 rounded-3xl bg-on-surface/5 border border-dashed border-on-surface/10 text-center">
                    <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">
                      Select a professional to see availability
                    </p>
                  </div>
                ) : slotLoading ? (
                  <div className="grid grid-cols-4 gap-3">
                    {[1,2,3,4,5,6,7,8].map(i => (
                      <div key={i} className="h-12 bg-on-surface/5 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-warning/5 border border-warning/10 text-center">
                    <p className="text-[10px] font-black text-warning uppercase tracking-widest">
                      {T.no_slots || 'No slots available'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setFormData({ ...formData, time: slot })}
                        className={`py-3.5 rounded-xl text-[10px] font-black transition-all border
                          ${formData.time === slot 
                            ? 'bg-primary text-white border-primary shadow-lg scale-[1.02]' 
                            : 'bg-on-surface/5 border-transparent text-on-surface/60 hover:bg-on-surface/10'}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Notes */}
          <section className="space-y-4">
            <div className="flex items-center gap-4 border-b border-on-surface/5 pb-4">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">
                {T.notes_label}
              </h3>
            </div>
            <textarea 
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder={T.notes_ph || 'Optional notes...'}
              rows={3}
              className="w-full bg-on-surface/5 border-none rounded-2xl px-6 py-4 text-sm font-medium text-on-surface focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
            />
          </section>
        </div>

        {/* Action Button */}
        <div className="p-8 md:p-12 border-t border-on-surface/5 bg-surface/80 backdrop-blur-md">
          <button 
            onClick={handleCreateAppointment}
            disabled={loading || saveSuccess || !formData.first_name || !formData.professional_id || !formData.time || !formData.service_id}
            className={`w-full py-6 rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-xl transition-all duration-500 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed
              ${saveSuccess ? 'bg-success text-white' : 'bg-primary text-white hover:shadow-primary/20 hover:-translate-y-0.5'}`}
          >
            {saveSuccess ? (
              <><CheckCircle className="h-4 w-4" /> {T.ready || 'DONE!'}</>
            ) : loading ? (
              <><Clock className="h-4 w-4 animate-spin" /> {T.reserving}</>
            ) : (
              <>{T.confirm_booking} <ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
