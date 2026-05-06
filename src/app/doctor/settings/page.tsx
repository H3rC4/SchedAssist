"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KeyRound, ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useLandingTranslation } from '@/components/LanguageContext'

export default function DoctorSettingsPage() {
  const { fullT, language } = useLandingTranslation()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (password !== confirmPassword) {
      setError(fullT.passwords_mismatch || 'Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError(fullT.password_length || 'Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setPassword('')
      setConfirmPassword('')
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 bg-surface min-h-screen p-4 md:p-8 animate-in fade-in duration-700">
      <div className="max-w-3xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-on-surface leading-tight uppercase flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-primary" />
                {fullT.security_settings || 'Ajustes de Seguridad'}
              </h1>
              <p className="mt-1 text-[9px] font-black text-on-surface-muted uppercase tracking-[0.3em] ml-11">
                {fullT.manage_password_desc || 'Gestión de contraseñas y seguridad de la cuenta'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-on-surface/5 rounded-[1.5rem] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-[1rem] bg-primary/5 flex items-center justify-center text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm font-black text-on-surface uppercase tracking-tight">{fullT.change_password}</h2>
              <p className="text-[10px] font-bold text-on-surface-muted uppercase tracking-widest mt-0.5">
                {language === 'es' ? 'Mantén tu cuenta segura actualizando tu contraseña periódicamente.' : 'Keep your account secure by updating your password periodically.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest ml-1">{fullT.new_password}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-surface-container-lowest border border-on-surface/10 rounded-xl px-5 py-4 text-sm font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-muted"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest ml-1">{fullT.confirm_password}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-surface-container-lowest border border-on-surface/10 rounded-xl px-5 py-4 text-sm font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-muted"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-[11px] uppercase tracking-widest font-black rounded-[1rem] border border-red-500/20 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 text-emerald-600 text-[11px] uppercase tracking-widest font-black rounded-[1rem] border border-emerald-500/20 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                {fullT.password_updated || '¡Contraseña actualizada con éxito!'}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-primary/90 hover:-translate-y-0.5 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : fullT.update}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
