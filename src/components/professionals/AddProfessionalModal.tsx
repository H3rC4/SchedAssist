"use client"

import { useState } from 'react'
import { X, UserPlus, CheckCircle, Loader2, ArrowRight, Sparkles, ChevronDown } from 'lucide-react'

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
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-500" />

      {/* DRAWER CONTENT */}
      <div 
        className="absolute top-0 right-0 h-full w-full max-w-md bg-surface shadow-spatial animate-in slide-in-from-right duration-700 flex flex-col border-l border-on-surface/5"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER SECTION */}
        <div className="bg-precision-surface-lowest p-6 border-b border-on-surface/5 flex-shrink-0">
          <div className="flex items-start justify-between mb-6">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
              <UserPlus className="h-5 w-5" />
            </div>
            <button 
              onClick={onClose}
              className="h-8 w-8 rounded-lg bg-surface-container-low text-on-surface-muted hover:text-on-surface hover:bg-surface-container-high transition-all active:scale-95"
            >
              <X className="h-4 w-4 mx-auto" />
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-on-surface tracking-tighter leading-none uppercase">
              {t.newProf}
            </h2>
            <p className="text-[8px] font-black text-on-surface-muted uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" /> {t.subtitle}
            </p>
          </div>
        </div>

        {/* BODY SECTION / FORM */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-surface">
          <form id="add-prof-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-on-surface-muted uppercase tracking-widest ml-1">
                {t.fullName}
              </label>
              <input
                required
                autoFocus
                value={data.full_name}
                onChange={e => setData({ ...data, full_name: e.target.value })}
                className="w-full h-10 bg-surface border border-on-surface/10 rounded-lg px-4 text-sm font-bold text-on-surface focus:border-primary outline-none transition-all"
                placeholder={t.fullNamePH}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-on-surface-muted uppercase tracking-widest ml-1">
                {t.specialty}
              </label>
              <input
                value={data.specialty}
                onChange={e => setData({ ...data, specialty: e.target.value })}
                className="w-full h-10 bg-surface border border-on-surface/10 rounded-lg px-4 text-sm font-bold text-on-surface focus:border-primary outline-none transition-all"
                placeholder={t.specialtyPH}
              />
            </div>

            {locations.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-on-surface-muted uppercase tracking-widest ml-1">
                  {t.locationLabel}
                </label>
                <div className="relative">
                  <select
                    value={data.location_id}
                    onChange={e => setData({ ...data, location_id: e.target.value })}
                    className="w-full h-10 bg-surface border border-on-surface/10 rounded-lg px-4 text-sm font-bold text-on-surface focus:border-primary outline-none transition-all appearance-none"
                  >
                    <option value="">{t.selectLocationOptional}</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-on-surface-muted" />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* FOOTER ACTION BAR */}
        <div className="p-6 bg-precision-surface-lowest border-t border-on-surface/5 flex items-center justify-between flex-shrink-0 z-30">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-on-surface-muted hover:text-on-surface hover:bg-on-surface/5 transition-all"
          >
            {t.cancel || 'Cancelar'}
          </button>
          
          <button
            form="add-prof-form"
            type="submit"
            disabled={loading || success}
            className={`flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-sm
              ${success ? 'bg-emerald-500 text-white' : 'bg-on-surface text-surface hover:bg-primary hover:text-white'}
            `}
          >
            {success ? (
              <><CheckCircle className="h-4 w-4 animate-in zoom-in" /> <span>{t.created}</span></>
            ) : loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>{t.createBtn}</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
