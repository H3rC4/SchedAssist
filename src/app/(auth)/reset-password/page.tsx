'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ShieldCheck, Mail, Lock, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useLandingTranslation } from '@/components/LanguageContext'

export default function ResetPasswordPage() {
  const { t } = useLandingTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  if (!token) {
    router.replace('/login?error=Invalid reset token')
    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!password || !confirmPassword) {
      setError(t('reset_password.fill_all_fields'))
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t('reset_password.passwords_do_not_match'))
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t('reset_password.password_min_length'))
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          password: password
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t('reset_password.failed_to_reset'))
      }

      setSuccess(true)
      setLoading(false)
    } catch (err: any) {
      console.error('Reset password error:', err)
      setError(err.message || t('reset_password.an_error_occurred'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white p-6 overflow-hidden relative">
      {/* Blur decorativo de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/[0.03] blur-[120px] rounded-full -z-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-xl w-full relative z-10"
      >
        <div className="flex justify-center mb-12">
          <Link href="/" className="hover:scale-105 transition-transform active:scale-95">
            <Logo />
          </Link>
        </div>

        <div className="border border-primary/10 p-12 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none select-none">
            <span className="text-6xl font-black uppercase tracking-tighter text-primary">{t('reset_password.recover')}</span>
          </div>

          <header className="mb-12 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/10 bg-primary/[0.03] text-primary text-[9px] font-black uppercase tracking-[0.2em] mb-6">
              <AlertCircle className="h-3 w-3" /> {t('reset_password.security_check')}
            </div>
            <h1 className="text-4xl font-black text-[#191c1e] tracking-tighter uppercase mb-3">
              {t('reset_password.reset_title')}
              <br />
              <span className="text-primary italic">{t('reset_password.access')}</span>
            </h1>
            <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em]">
              {t('reset_password.precision_recovery')}
            </p>
          </header>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-red-50 border border-red-200 flex items-center gap-4"
            >
              <div className="h-10 w-10 bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-red-800 tracking-tight uppercase">
                {error}
              </p>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-emerald-50 border border-emerald-200 flex items-center gap-4"
            >
              <div className="h-10 w-10 bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-emerald-800 tracking-tight">
                {t('reset_password.password_reset_success')}
              </p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-primary/10" />
              <span className="text-[8px] font-black text-primary/30 uppercase tracking-[0.4em]">{t('reset_password.or_email')}</span>
              <div className="h-px flex-1 bg-primary/10" />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">
                {t('reset_password.new_password')}
              </label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-14 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">
                {t('reset_password.confirm_password')}
              </label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-14 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white text-xs font-black uppercase tracking-[0.4em] transition-all shadow-xl shadow-primary/20 hover:bg-primary-light hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="ml-2">{t('reset_password.resetting')}</span>
                </>
              ) : (
                <>
                  <span>{t('reset_password.reset_password')}</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <Link
          href="/"
          className="flex items-center justify-center gap-3 text-[10px] font-black text-primary/50 uppercase tracking-[0.4em] mt-10 hover:text-primary transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-2" />
          {t('reset_password.back_to_portal')}
        </Link>
      </motion.div>
    </div>
  )
}
