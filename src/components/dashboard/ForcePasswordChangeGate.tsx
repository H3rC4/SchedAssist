"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Language, translations } from '@/lib/i18n'
import { KeyRound, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function ForcePasswordChangeGate({ 
  lang = 'es',
  onSuccess 
}: { 
  lang?: Language
  onSuccess: () => void 
}) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const t = translations[lang] || translations['es']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError(t.password_length || 'La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError(t.passwords_mismatch || 'Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/professionals/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error changing password')
      
      onSuccess()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-white/5"
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6">
          <KeyRound className="h-6 w-6" />
        </div>

        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-2">
          {t.change_password}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          {lang === 'es' 
            ? 'Por razones de seguridad, debes cambiar tu contraseña temporal antes de acceder al panel.' 
            : lang === 'it'
            ? 'Per motivi di sicurezza, devi cambiare la tua password temporanea prima di accedere al pannello.'
            : 'For security reasons, you must change your temporary password before accessing the dashboard.'}
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {t.new_password}
            </label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {t.confirm_password}
            </label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 mt-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t.update}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
