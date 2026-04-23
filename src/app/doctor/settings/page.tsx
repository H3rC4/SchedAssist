"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KeyRound, ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useLandingTranslation } from '@/components/LanguageContext'

export default function DoctorSettingsPage() {
  const { fullT } = useLandingTranslation()
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
    <div className="max-w-3xl animate-in fade-in duration-500 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary-600" /> {fullT.security_settings || 'Security Settings'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{fullT.manage_password_desc || 'Manage your password.'}</p>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{fullT.change_password}</h2>
            <p className="text-xs text-gray-500">
              Mantén tu cuenta segura actualizando tu contraseña periódicamente.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">{fullT.new_password}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">{fullT.confirm_password}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-xl border border-emerald-100 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              {fullT.password_updated || 'Password updated successfully!'}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : fullT.update}
          </button>
        </form>
      </div>
    </div>
  )
}
