"use client"

import { useState } from 'react'
import { X, UserPlus, CheckCircle, Loader2 } from 'lucide-react'

interface AddProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { full_name: string, specialty: string }) => Promise<{ success: boolean }>;
  t: any;
}

export function AddProfessionalModal({ isOpen, onClose, onConfirm, t }: AddProfessionalModalProps) {
  const [data, setData] = useState({ full_name: '', specialty: '' })
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
        setData({ full_name: '', specialty: '' })
        onClose()
      }, 1500)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="p-8 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="h-14 w-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
              <UserPlus className="h-7 w-7" />
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">{t.newProf}</h3>
          <p className="text-sm font-medium text-gray-500 mb-8">{t.subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t.fullName}</label>
              <input
                required
                value={data.full_name}
                onChange={e => setData({ ...data, full_name: e.target.value })}
                className="w-full rounded-2xl bg-gray-50 border border-gray-100 px-6 py-4 text-sm font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                placeholder={t.fullNamePH}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t.specialty}</label>
              <input
                value={data.specialty}
                onChange={e => setData({ ...data, specialty: e.target.value })}
                className="w-full rounded-2xl bg-gray-50 border border-gray-100 px-6 py-4 text-sm font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                placeholder={t.specialtyPH}
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full h-16 rounded-2xl bg-primary-600 text-white font-black uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
            >
              {success ? (
                <><CheckCircle className="h-6 w-6 animate-in zoom-in" /> {t.created}</>
              ) : loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : t.createBtn}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
