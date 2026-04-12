"use client"

import { useState } from 'react'
import { X, Calendar, User, Phone, Stethoscope, Briefcase, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { PatientSearch } from './PatientSearch'
import { Client } from '@/hooks/useAppointments'

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
    const duration = 30 // hardcoded for now as per legacy
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-2xl animate-in zoom-in-95 duration-300" onClick={onClose}>
      <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] w-full max-w-2xl overflow-hidden border border-white max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 via-primary-600 to-primary-800" />
          <div className="p-10 px-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">{T.modalTitle}</h3>
                <p className="text-sm font-bold text-primary-600 uppercase tracking-[0.2em] mt-1">{T.modalSubtitle}</p>
              </div>
              <button onClick={onClose} className="h-14 w-14 bg-gray-50 rounded-3xl flex items-center justify-center hover:bg-gray-100 hover:scale-110 active:scale-95 transition-all">
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <PatientSearch tenantId={tenantId} lang={lang} onSelect={handleSelectPatient} translations={T} />

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{T.orNew}</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{T.whenLabel}</label>
                <div className="relative">
                  <Calendar className="absolute left-5 top-5 h-5 w-5 text-gray-300" />
                  <input type="date" min={format(new Date(), 'yyyy-MM-dd')} value={formData.date}
                    onChange={e => {
                      const newDate = e.target.value
                      setFormData({ ...formData, date: newDate, time: '' })
                      if (formData.professional_id) onFetchSlots(formData.professional_id, newDate)
                    }}
                    className="w-full rounded-[2rem] bg-indigo-50/30 border border-indigo-100 pl-14 pr-6 py-5 text-base font-black text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{T.nameLabel}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 h-5 w-5 text-gray-300" />
                    <input value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full rounded-2xl bg-gray-50 border border-gray-100 pl-12 pr-6 py-4 text-sm font-black text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                      placeholder={lang === 'it' ? 'Mario' : (lang === 'es' ? 'Ignacio' : 'John')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{T.lastNameLabel}</label>
                  <div className="relative">
                    <input value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full rounded-2xl bg-gray-50 border border-gray-100 px-6 py-4 text-sm font-black text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                      placeholder={lang === 'it' ? 'Rossi' : (lang === 'es' ? 'Castro' : 'Doe')} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{T.phoneLabel}</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-4 h-5 w-5 text-gray-300" />
                  <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-2xl bg-gray-50 border border-gray-100 pl-12 pr-6 py-4 text-sm font-black text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                    placeholder="+39 333 123 4567" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{T.serviceLabel}</label>
                  <div className="relative">
                    <Stethoscope className="absolute left-4 top-4 h-5 w-5 text-gray-300 pointer-events-none" />
                    <select value={formData.service_id}
                      onChange={e => setFormData({ ...formData, service_id: e.target.value })}
                      className="w-full rounded-2xl bg-gray-50 border border-gray-100 pl-12 pr-10 py-4 text-sm font-black text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none appearance-none">
                      <option value="">{T.selectOption}</option>
                      {services.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{T.profLabel}</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-4 h-5 w-5 text-gray-300 pointer-events-none" />
                    <select value={formData.professional_id}
                      onChange={e => {
                        const profId = e.target.value
                        setFormData({ ...formData, professional_id: profId, time: '' })
                        if (profId) onFetchSlots(profId, formData.date)
                      }}
                      className="w-full rounded-2xl bg-gray-50 border border-gray-100 pl-12 pr-10 py-4 text-sm font-black text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none appearance-none">
                      <option value="">{T.selectOption}</option>
                      {professionals.map(o => <option key={o.id} value={o.id}>{o.full_name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {formData.professional_id && (
                <div className="animate-in slide-in-from-bottom-4 duration-500 bg-primary-50/20 p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-primary-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em]">{T.slotsLabel}</label>
                    {slotLoading && <div className="h-4 w-4 border-2 border-primary-600 border-t-transparent animate-spin rounded-full" />}
                  </div>
                  {availableSlots.length === 0 && !slotLoading ? (
                    <div className="text-center py-4 bg-white/50 rounded-2xl border border-dashed border-orange-200">
                      <p className="text-xs font-bold text-orange-500">{T.noSlots}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                      {availableSlots.map(slot => (
                        <button key={slot} type="button" onClick={() => setFormData({ ...formData, time: slot })}
                          className={`px-3 md:px-4 py-3 rounded-xl text-[10px] font-black transition-all border
                            ${formData.time === slot ? 'bg-primary-600 text-white border-primary-600 shadow-xl shadow-primary-200' : 'bg-white border-gray-100 text-gray-600 hover:border-primary-300'}`}>
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button onClick={handleCreateAppointment}
                disabled={loading || saveSuccess || !formData.first_name || !formData.professional_id || !formData.time}
                className={`w-full py-6 rounded-[2rem] font-black text-lg shadow-2xl transition-all duration-500 mt-4 uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                  ${saveSuccess ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-gray-900 text-white hover:bg-primary-600 shadow-primary-300'}`}>
                {saveSuccess ? (
                  <><CheckCircle className="h-6 w-6" /> {T.ready || 'DONE!'}</>
                ) : loading ? T.reserving : T.confirm}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
