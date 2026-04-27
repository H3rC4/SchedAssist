"use client"

import { useState } from 'react'
import { X, UserPlus, CheckCircle, Loader2 } from 'lucide-react'

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-primary-950/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="p-8 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="h-14 w-14 rounded-2xl bg-[#0B1120] border-2 border-accent-500/30 flex items-center justify-center text-accent-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <UserPlus className="h-7 w-7" />
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <X className="h-6 w-6 text-primary-400" />
            </button>
          </div>

          <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{t.newProf}</h3>
          <p className="text-sm font-bold text-primary-300 uppercase tracking-widest mb-8">{t.subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-2">{t.fullName}</label>
              <input
                required
                value={data.full_name}
                onChange={e => setData({ ...data, full_name: e.target.value })}
                className="w-full rounded-2xl bg-primary-900/50 border border-white/10 px-6 py-4 text-sm font-black text-white focus:bg-primary-900 focus:ring-4 focus:ring-accent-500/20 focus:border-accent-500 transition-all outline-none placeholder-primary-500"
                placeholder={t.fullNamePH}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-2">{t.specialty}</label>
              <input
                value={data.specialty}
                onChange={e => setData({ ...data, specialty: e.target.value })}
                className="w-full rounded-2xl bg-primary-900/50 border border-white/10 px-6 py-4 text-sm font-black text-white focus:bg-primary-900 focus:ring-4 focus:ring-accent-500/20 focus:border-accent-500 transition-all outline-none placeholder-primary-500"
                placeholder={t.specialtyPH}
              />
            </div>

            {locations.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-2">{t.locationLabel}</label>
                <select
                  value={data.location_id}
                  onChange={e => setData({ ...data, location_id: e.target.value })}
                  className="w-full rounded-2xl bg-primary-900/50 border border-white/10 px-6 py-4 text-sm font-black text-white focus:bg-primary-900 focus:ring-4 focus:ring-accent-500/20 focus:border-accent-500 transition-all outline-none"
                >
                  <option value="" className="bg-primary-900 text-white">{t.selectLocationOptional}</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id} className="bg-primary-900 text-white">{loc.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full h-16 rounded-2xl bg-accent-500 text-primary-950 font-black uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:bg-accent-400 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
            >
              {success ? (
                <><CheckCircle className="h-6 w-6 animate-in zoom-in" /> {t.created}</>
              ) : loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary-950" />
              ) : t.createBtn}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
