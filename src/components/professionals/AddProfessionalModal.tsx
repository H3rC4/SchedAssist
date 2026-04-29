"use client"

import { useState } from 'react'
import { X, UserPlus, CheckCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react'

interface AddProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { full_name: string, specialty: string, location_id?: string }) => Promise<{ success: boolean }>;
  t: any;
  locations?: any[];
}

export function AddProfessionalModal({ isOpen, onClose, onConfirm, t, locations = [] }: AddProfessionalModalProps) {
  const [data, setData] = useState({ full_name: '', specialty: '', location_id: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await onConfirm(data)
    if (res.success) {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setData({ full_name: '', specialty: '', location_id: '' })
        onClose()
      }, 1500)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" onClick={onClose}>
      {/* OVERLAY */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500" />

      {/* DRAWER CONTENT */}
      <div 
        className="absolute top-0 right-0 h-full w-full max-w-2xl bg-surface shadow-spatial animate-in slide-in-from-right duration-700 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER SECTION */}
        <div className="bg-surface-container-lowest p-8 md:p-12 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-start justify-between mb-10">
            <div className="h-20 w-20 rounded-[2rem] bg-primary flex items-center justify-center text-white shadow-spatial">
              <UserPlus className="h-8 w-8" />
            </div>
            <button 
              onClick={onClose}
              className="p-4 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-95 shadow-ambient"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none uppercase">
              {t.newProf}
            </h2>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> {t.subtitle}
            </p>
          </div>
        </div>

        {/* BODY SECTION / FORM */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
          <form id="add-prof-form" onSubmit={handleSubmit} className="space-y-12 max-w-lg">
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                {t.fullName}
              </label>
              <input
                required
                autoFocus
                value={data.full_name}
                onChange={e => setData({ ...data, full_name: e.target.value })}
                className="w-full h-20 bg-white rounded-[2rem] border-2 border-slate-100 px-8 font-black text-slate-900 text-lg focus:border-primary focus:ring-0 transition-all shadow-ambient outline-none placeholder:text-slate-200"
                placeholder={t.fullNamePH}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                {t.specialty}
              </label>
              <input
                value={data.specialty}
                onChange={e => setData({ ...data, specialty: e.target.value })}
                className="w-full h-20 bg-white rounded-[2rem] border-2 border-slate-100 px-8 font-black text-slate-900 text-lg focus:border-primary focus:ring-0 transition-all shadow-ambient outline-none placeholder:text-slate-200"
                placeholder={t.specialtyPH}
              />
            </div>

            {locations.length > 0 && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  {t.locationLabel}
                </label>
                <div className="relative">
                  <select
                    value={data.location_id}
                    onChange={e => setData({ ...data, location_id: e.target.value })}
                    className="w-full h-20 bg-white rounded-[2rem] border-2 border-slate-100 px-8 font-black text-slate-900 text-lg focus:border-primary focus:ring-0 transition-all shadow-ambient outline-none appearance-none"
                  >
                    <option value="">{t.selectLocationOptional}</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ArrowRight className="h-6 w-6 text-slate-300 rotate-90" />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* FOOTER ACTION BAR */}
        <div className="p-8 md:p-12 bg-white border-t border-slate-100 flex items-center justify-between flex-shrink-0 z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
          <button 
            type="button"
            onClick={onClose}
            className="py-6 px-10 rounded-full text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-50"
          >
            {t.cancel || 'Cancelar'}
          </button>
          
          <button
            form="add-prof-form"
            type="submit"
            disabled={loading || success}
            className={`group flex items-center justify-center gap-4 py-6 px-16 rounded-full font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 disabled:opacity-50 shadow-spatial
              ${success ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-slate-900'}
            `}
          >
            {success ? (
              <><CheckCircle className="h-5 w-5 animate-in zoom-in" /> <span>{t.created}</span></>
            ) : loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>{t.createBtn}</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
