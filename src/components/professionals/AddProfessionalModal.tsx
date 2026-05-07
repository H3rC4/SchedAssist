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
      <div className="absolute inset-0 bg-primary/[0.03] blur-[120px] rounded-full -z-10 pointer-events-none" />

      {/* DRAWER CONTENT */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-full max-w-xl bg-white border border-primary/10 p-12 md:p-16 relative overflow-hidden z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER SECTION */}
        <div className="mb-12">
          <div className="flex justify-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
              <UserPlus className="h-5 w-5" />
            </div>
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/10 bg-primary/[0.03] text-primary text-[9px] font-black uppercase tracking-[0.2em] mb-6">
            <Sparkles className="h-3 w-3" /> {t.subtitle || 'Add New Professional'}
          </div>
          
          <h2 className="text-3xl font-black text-[#191c1e] tracking-tighter uppercase mb-4 text-center">
            {t.newProf}
          </h2>
          <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em] text-center">
            {t.subtitleDesc || 'Professional Registration'}
          </p>
        </div>

        {/* BODY SECTION / FORM */}
        <div className="space-y-5 relative z-10">
          <form id="add-prof-form" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-2">
              <label className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">
                {t.fullName}
              </label>
              <div className="relative group">
                <UserPlus className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                <input
                  required
                  autoFocus
                  value={data.full_name}
                  onChange={e => setData({ ...data, full_name: e.target.value })}
                  className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-14 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  placeholder={t.fullNamePH}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">
                {t.specialty}
              </label>
              <div className="relative group">
                <Sparkles className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                <input
                  value={data.specialty}
                  onChange={e => setData({ ...data, specialty: e.target.value })}
                  className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-14 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  placeholder={t.specialtyPH}
                />
              </div>
            </div>

            {locations.length > 0 && (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">
                  {t.locationLabel}
                </label>
                <div className="relative group">
                  <Building className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                  <select
                    value={data.location_id}
                    onChange={e => setData({ ...data, location_id: e.target.value })}
                    className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-14 pr-10 text-sm font-bold text-[#191c1e] focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none"
                  >
                    <option value="">{t.selectLocationOptional}</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 pointer-events-none" />
                </div>
              </div>
            )}
          </form>
          
          <div className="pt-4">
            <button
              type="submit"
              form="add-prof-form"
              disabled={loading || success}
              className="w-full py-4 bg-primary text-white text-xs font-black uppercase tracking-[0.4em] transition-all shadow-xl shadow-primary/20 hover:bg-primary-light hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
            >
              {success ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>{t.created}</span>
                </>
              ) : loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{t.createBtn}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* FOOTER ACTION BAR */}
        <div className="mt-8 pt-6 border-t border-primary/10 flex flex-col items-center gap-4 text-center relative z-10">
          <button 
            onClick={onClose}
            className="text-[9px] font-black text-primary/60 uppercase tracking-widest hover:text-primary transition-colors"
          >
            {t.cancel || 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Import Building icon
import { Building } from 'lucide-react'