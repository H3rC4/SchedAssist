"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, Save, AlertCircle, Check } from 'lucide-react'
import { usePlanLimits } from '@/hooks/usePlanLimits'

interface NewPatientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'es' | 'it';
  translations: any;
  tenantId?: string;
  onCreatePatient: (data: { first_name: string; last_name: string; phone: string; notes: string }) => Promise<void>;
}

export function NewPatientDrawer({
  isOpen,
  onClose,
  translations: t,
  tenantId,
  onCreatePatient
}: NewPatientDrawerProps) {
  const { canAddPatient, limits: planLimits } = usePlanLimits(tenantId || '')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName || !lastName || !phone) return;

    setIsSaving(true)
    setError(null)
    try {
      await onCreatePatient({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        notes: notes
      })
      
      setIsSuccess(true)
      
      setTimeout(() => {
        setIsSuccess(false)
        setFirstName('')
        setLastName('')
        setPhone('')
        setNotes('')
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Error creating patient')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-secondary-900/40 backdrop-blur-[2px]"
        />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md h-full bg-surface-container-lowest shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 bg-surface-container-lowest border-b border-surface-container-low">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-2xl font-black text-secondary-900 tracking-tight leading-none mb-2">
                  {t.new_patient || 'New Patient'}
                </h2>
                <p className="text-secondary-600 font-bold uppercase tracking-widest text-[10px]">
                  {t.create_patient_desc || 'Complete the information to register a new patient'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-surface-container-low text-secondary-600 hover:text-secondary-900 transition-colors border border-surface-container-mid"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
            {error && (
              <div className="bg-error-50 border border-error-100 p-4 rounded-2xl flex items-center gap-3 text-error-700 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-secondary-600 uppercase tracking-widest mb-2 px-1">
                  {t.first_name || 'First Name'}
                </label>
                <input
                  required
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-white rounded-2xl p-4 text-sm font-medium text-secondary-900 border-none ring-1 ring-surface-container-low focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                  placeholder="..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-secondary-600 uppercase tracking-widest mb-2 px-1">
                  {t.last_name || 'Last Name'}
                </label>
                <input
                  required
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-white rounded-2xl p-4 text-sm font-medium text-secondary-900 border-none ring-1 ring-surface-container-low focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                  placeholder="..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-secondary-600 uppercase tracking-widest mb-2 px-1">
                  {t.phone || 'Phone'}
                </label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white rounded-2xl p-4 text-sm font-medium text-secondary-900 border-none ring-1 ring-surface-container-low focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                  placeholder="e.g., +34..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-secondary-600 uppercase tracking-widest mb-2 px-1">
                  {t.notes || 'Notes'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white rounded-2xl p-4 text-sm font-medium text-secondary-900 min-h-[120px] border-none ring-1 ring-surface-container-low focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none shadow-sm"
                  placeholder="..."
                />
              </div>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="p-8 border-t border-surface-container-low bg-white">
            {!canAddPatient && planLimits.patients && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-amber-800 uppercase tracking-tight">
                    {t.plan_limit_reached || 'Limit reached'}
                  </p>
                  <p className="text-[10px] font-bold text-amber-600 mt-1">
                    {t.plan_limit_patients || 'Maximum patients reached for your plan.'}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSaving || isSuccess || !firstName || !lastName || !phone || !canAddPatient}
              className={`w-full flex items-center justify-center py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${
                isSuccess 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' 
                  : 'bg-primary hover:bg-primary-light text-white shadow-primary/20'
              }`}
            >
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {t.saved || 'Carga exitosa'}
                  </motion.div>
                ) : isSaving ? (
                  <motion.div
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {t.saving || 'Guardando...'}
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    {t.create_patient || t.save}
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            <button
              onClick={onClose}
              className="w-full mt-4 text-secondary-600 hover:text-secondary-900 py-2 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              {t.cancel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
