"use client"

import { useEffect, useState } from 'react'
import { KeyRound, Eye, EyeOff, Languages } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { translations, Language } from '@/lib/i18n'

export default function SettingsPage() {
  const [lang, setLang] = useState<Language>('es')
  const [tenantId, setTenantId] = useState('')
  const [tenantSettings, setTenantSettings] = useState<any>({})

  // Password change state
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Language change state
  const [selectedLang, setSelectedLang] = useState<Language>('es')
  const [isSavingLang, setIsSavingLang] = useState(false)
  const [langMessage, setLangMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  const t = translations[lang] || translations['en']

  useEffect(() => {
    const supabase = createClient()
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: tuData } = await supabase
          .from('tenant_users')
          .select('tenant_id, tenants(id, settings)')
          .eq('user_id', user.id)
          .limit(1).single()
        if (!tuData?.tenants) return
        const tenant = tuData.tenants as any
        const loadedLang = (tenant.settings?.language as Language) || 'es'
        setLang(loadedLang)
        setSelectedLang(loadedLang)
        setTenantSettings(tenant.settings || {})
        setTenantId(tenant.id)
      } catch (error) {
        console.error('Error fetching settings', error)
      }
    }
    fetchData()
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setPasswordMessage({ text: t.passwords_mismatch, type: 'error' })
      return
    }
    if (password.length < 6) {
      setPasswordMessage({ text: t.password_length, type: 'error' })
      return
    }
    setIsUpdatingPassword(true)
    setPasswordMessage(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setPasswordMessage({ text: error.message, type: 'error' })
    } else {
      setPasswordMessage({ text: t.password_updated, type: 'success' })
      setPassword('')
      setConfirmPassword('')
    }
    setIsUpdatingPassword(false)
  }

  const handleSaveLanguage = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingLang(true)
    setLangMessage(null)
    const supabase = createClient()
    const newSettings = { ...tenantSettings, language: selectedLang }
    const { error } = await supabase
      .from('tenants')
      .update({ settings: newSettings })
      .eq('id', tenantId)
    if (error) {
      setLangMessage({ text: error.message || t.error, type: 'error' })
    } else {
      setLang(selectedLang)
      setTenantSettings(newSettings)
      setLangMessage({ text: t.config_saved, type: 'success' })
    }
    setIsSavingLang(false)
  }

  return (
    <div className="flex-1 space-y-12 p-8 md:p-12 animate-in fade-in duration-700">
      <div>
        <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
          {t.system_settings}
        </h2>
        <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-[0.2em]">
          Administración de la Cuenta
        </p>
      </div>

      <div className="grid gap-10 max-w-xl">

        {/* Services Navigation Link */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-900/5 p-10 transition-all hover:shadow-indigo-900/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Gestión de Servicios
            </h3>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-6 uppercase tracking-widest pl-1">
            Administra los servicios que ofrece tu clínica.
          </p>
          <a href="/dashboard/services" className="w-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-300 py-4 px-6 rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-sm active:scale-95 text-center">
            Manejar Servicios
          </a>
        </div>

        {/* Language Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-900/5 p-10 transition-all hover:shadow-indigo-900/10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <Languages className="h-6 w-6 text-indigo-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {t.language_settings}
            </h3>
          </div>
          <form onSubmit={handleSaveLanguage} className="space-y-6">
            <p className="text-xs font-semibold text-slate-400 leading-relaxed uppercase tracking-wider">
              {t.bot_language_desc}
            </p>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2">
                {t.system_language}
              </label>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value as Language)}
                className="block w-full rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-slate-50/50 dark:bg-slate-800/30 py-4 px-5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 transition-all appearance-none"
              >
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="it">Italiano</option>
              </select>
            </div>
            {langMessage && (
              <div className={`p-4 rounded-xl text-xs font-bold border ${langMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                {langMessage.text}
              </div>
            )}
            <button
              type="submit"
              disabled={isSavingLang}
              className="w-full bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 disabled:opacity-50 transition-all text-white dark:text-slate-900 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-lg active:scale-95"
            >
              {isSavingLang ? '...' : t.save_config}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-900/5 p-10 transition-all hover:shadow-indigo-900/10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
              <KeyRound className="h-6 w-6 text-violet-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {t.change_password}
            </h3>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                {t.new_password}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-slate-50/50 dark:bg-slate-800/30 py-4 px-5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 transition-all pr-12"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-500 transition-colors p-2">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                {t.confirm_password}
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-slate-50/50 dark:bg-slate-800/30 py-4 px-5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 transition-all"
                required
              />
            </div>
            {passwordMessage && (
              <div className={`p-4 rounded-xl text-xs font-bold border ${passwordMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                {passwordMessage.text}
              </div>
            )}
            <button
              type="submit"
              disabled={isUpdatingPassword || !password || !confirmPassword}
              className="w-full bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 disabled:opacity-50 transition-all text-white dark:text-slate-900 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-lg active:scale-95"
            >
              {isUpdatingPassword ? '...' : t.update}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
