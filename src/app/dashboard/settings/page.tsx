"use client"

import { useEffect, useState } from 'react'
import { KeyRound, Eye, EyeOff, Languages, Upload, Image as ImageIcon, Loader2, AlertTriangle, Clock, ListOrdered } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { translations, Language } from '@/lib/i18n'

export default function SettingsPage() {
  const [lang, setLang] = useState<Language>('es')
  const [tenantId, setTenantId] = useState('')
  const [tenantSettings, setTenantSettings] = useState<any>({})
  const [isGoogleUser, setIsGoogleUser] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

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

  // Clinic info state
  const [contactPhone, setContactPhone] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#fbbf24') // Default amber-500
  const [customDomain, setCustomDomain] = useState('')
  const [isSavingClinic, setIsSavingClinic] = useState(false)
  const [clinicMessage, setClinicMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  // Danger zone
  const [isDeletingTenant, setIsDeletingTenant] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showDangerZone, setShowDangerZone] = useState(false)

  // Waitlist settings
  const [waitlistAutoNotify, setWaitlistAutoNotify] = useState(true)
  const [waitlistOfferTimeout, setWaitlistOfferTimeout] = useState(30)
  const [isSavingWaitlist, setIsSavingWaitlist] = useState(false)
  const [waitlistMessage, setWaitlistMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const t = translations[lang] || translations['en']

  useEffect(() => {
    const supabase = createClient()
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Check for Google provider
        const isGoogle = user.app_metadata.provider === 'google' || 
                         user.identities?.some(id => id.provider === 'google')
        setIsGoogleUser(!!isGoogle)

        const { data: tuData } = await supabase
          .from('tenant_users')
          .select('tenant_id, role, tenants(id, settings)')
          .eq('user_id', user.id)
          .limit(1).single()
        if (!tuData?.tenants) return
        const tenant = tuData.tenants as any
        const loadedLang = (tenant.settings?.language as Language) || 'es'
        setLang(loadedLang)
        setSelectedLang(loadedLang)
        setTenantSettings(tenant.settings || {})
        setContactPhone(tenant.settings?.contact_phone || '')
        setLogoUrl(tenant.settings?.logo_url || '')
        setPrimaryColor(tenant.settings?.primary_color || '#fbbf24')
        setCustomDomain(tenant.settings?.custom_domain || '')
        setWaitlistAutoNotify(tenant.settings?.waitlist_auto_notify !== false) // default true
        setWaitlistOfferTimeout(tenant.settings?.waitlist_offer_timeout_minutes ?? 30)
        setTenantId(tenant.id)
        setUserRole(tuData.role)
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
      setIsSavingLang(false)
    } else {
      setLang(selectedLang)
      setTenantSettings(newSettings)
      setLangMessage({ text: t.config_saved, type: 'success' })
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingClinic(true)
    setClinicMessage(null)
    const supabase = createClient()
    const newSettings = { 
      ...tenantSettings, 
      contact_phone: contactPhone,
      logo_url: logoUrl,
      primary_color: primaryColor,
      custom_domain: customDomain
    }
    const { error } = await supabase
      .from('tenants')
      .update({ settings: newSettings })
      .eq('id', tenantId)
    if (error) {
      setClinicMessage({ text: error.message || t.error, type: 'error' })
    } else {
      setTenantSettings(newSettings)
      setClinicMessage({ text: t.config_saved, type: 'success' })
      // Update global CSS variable for preview
      document.documentElement.style.setProperty('--primary-color', primaryColor)
    }
    setIsSavingClinic(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)
    setClinicMessage(null)
    const supabase = createClient()

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${tenantId}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)

      setLogoUrl(publicUrl)
      setClinicMessage({ text: t.logo_uploaded, type: 'success' })
    } catch (error: any) {
      setClinicMessage({ text: error.message || t.error, type: 'error' })
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleRestartTutorial = async () => {
    setIsSavingLang(true)
    const supabase = createClient()
    const newSettings = { ...tenantSettings, tutorial_completed: false }
    const { error } = await supabase
      .from('tenants')
      .update({ settings: newSettings })
      .eq('id', tenantId)
    
    if (!error) {
      window.location.href = '/dashboard'
    }
    setIsSavingLang(false)
  }

  const handleSaveWaitlistSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingWaitlist(true)
    setWaitlistMessage(null)
    const supabase = createClient()
    const newSettings = {
      ...tenantSettings,
      waitlist_auto_notify: waitlistAutoNotify,
      waitlist_offer_timeout_minutes: waitlistOfferTimeout,
    }
    const { error } = await supabase
      .from('tenants')
      .update({ settings: newSettings })
      .eq('id', tenantId)
    if (error) {
      setWaitlistMessage({ text: error.message, type: 'error' })
    } else {
      setTenantSettings(newSettings)
      setWaitlistMessage({ text: t.config_saved, type: 'success' })
      setTimeout(() => setWaitlistMessage(null), 3000)
    }
    setIsSavingWaitlist(false)
  }

  const [isDeleted, setIsDeleted] = useState(false)

  const handleDeleteTenant = async () => {
    const requiredPhrase = lang === 'it' ? 'ELIMINA' : (lang === 'en' ? 'DELETE' : 'ELIMINAR')
    if (deleteConfirmText !== requiredPhrase) return
    setIsDeletingTenant(true)
    try {
      const res = await fetch(`/api/tenant/delete?tenant_id=${tenantId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setIsDeleted(true)
        setTimeout(async () => {
          const supabase = createClient()
          await supabase.auth.signOut()
          window.location.href = '/'
        }, 4000)
      } else {
        const body = await res.json()
        alert('Error: ' + (body.error || 'Unknown error'))
        setIsDeletingTenant(false)
      }
    } catch (e: any) {
      alert('Error: ' + e.message)
      setIsDeletingTenant(false)
    }
  }

  return (
    <div className="flex-1 space-y-8 md:space-y-12 p-4 md:p-12 animate-in fade-in duration-700">
      <div>
        <h2 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
          {t.system_settings}
        </h2>
        <p className="text-[10px] md:text-sm font-bold text-slate-400 mt-2 uppercase tracking-[0.2em]">
          {t.account_administration || 'Administración de la Cuenta'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">

        {(userRole === 'admin' || userRole === 'tenant_admin' || userRole === 'owner') && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-900/5 p-6 md:p-10 transition-all hover:shadow-indigo-900/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {t.manage_services_title}
              </h3>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-6 uppercase tracking-widest pl-1">
              {t.manage_services_desc}
            </p>
            <a href="/dashboard/services" className="w-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-300 py-4 px-6 rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-sm active:scale-95 text-center">
              {t.manage_services_btn}
            </a>
          </div>
        )}

        {/* Clinic Configuration - Only for Admin */}
        {(userRole === 'admin' || userRole === 'tenant_admin' || userRole === 'owner') && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-900/5 p-6 md:p-10 transition-all hover:shadow-indigo-900/10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {t.clinic_settings_title}
            </h3>
          </div>
          <form onSubmit={handleSaveClinic} className="space-y-6">
            <p className="text-xs font-semibold text-slate-400 leading-relaxed uppercase tracking-wider">
              Personaliza la apariencia de tu portal de reservas y datos de contacto.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2">
                  {lang === 'es' ? 'Teléfono de Contacto' : (lang === 'it' ? 'Telefono di Contatto' : 'Contact Phone')}
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+54 9 11 ..."
                  className="block w-full rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-slate-50/50 dark:bg-slate-800/30 py-4 px-5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 transition-all appearance-none outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2">
                  {lang === 'es' ? 'Color Primario' : (lang === 'it' ? 'Colore Primario' : 'Primary Color')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-14 w-20 rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-1 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-slate-50/50 dark:bg-slate-800/30 py-4 px-5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 transition-all appearance-none outline-none"
                  />
                </div>
              </div>
            </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2">
                  {t.upload_logo}
                </label>
                <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/30 border-2 border-dashed border-slate-200 dark:border-slate-800 transition-all hover:border-amber-500/50">
                  <div className="h-32 w-32 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center relative shadow-inner">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-slate-200" />
                    )}
                    {isUploadingLogo && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <p className="text-xs font-bold text-slate-500 max-w-xs mx-auto md:mx-0">
                      Formatos soportados: PNG, JPG o SVG. Tamaño máximo 2MB.
                    </p>
                    <div className="relative inline-block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={isUploadingLogo}
                      />
                      <button
                        type="button"
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-95"
                      >
                        <Upload className="h-4 w-4" />
                        {isUploadingLogo ? t.uploading : t.upload_logo}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2">
                Dominio Personalizado (Beta)
              </label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">WWW</div>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="ej: citas.tuclinica.com"
                  className="block w-full rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-slate-50/50 dark:bg-slate-800/30 py-4 pl-16 pr-5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 transition-all appearance-none outline-none"
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1 ml-2 uppercase tracking-widest">Apunta un registro CNAME a portal.schedassist.com</p>
            </div>

            {clinicMessage && (
              <div className={`p-4 rounded-xl text-xs font-bold border ${clinicMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                {clinicMessage.text}
              </div>
            )}
            <button
              type="submit"
              disabled={isSavingClinic}
              className="w-full bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 disabled:opacity-50 transition-all text-white dark:text-slate-900 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-lg active:scale-95"
            >
              {isSavingClinic ? '...' : t.save_config}
            </button>
          </form>
        </div>
        )}

        {/* Language Settings - Only for Admin */}
        {(userRole === 'admin' || userRole === 'tenant_admin' || userRole === 'owner') && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-900/5 p-6 md:p-10 transition-all hover:shadow-indigo-900/10">
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
        )}

        {/* Waitlist Settings */}
        {(userRole === 'admin' || userRole === 'tenant_admin' || userRole === 'owner') && (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-900/5 p-6 md:p-10 transition-all hover:shadow-indigo-900/10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <ListOrdered className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {lang === 'es' ? 'Lista de Espera' : lang === 'it' ? "Lista d'Attesa" : 'Waitlist'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                {lang === 'es' ? 'Configuración de notificaciones' : lang === 'it' ? 'Configurazione notifiche' : 'Notification settings'}
              </p>
            </div>
          </div>
          <form onSubmit={handleSaveWaitlistSettings} className="space-y-6">

            {/* Auto / Manual toggle */}
            <div className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {lang === 'es' ? 'Notificación automática' : lang === 'it' ? 'Notifica automatica' : 'Automatic notification'}
                </p>
                <p className="text-[11px] font-medium text-slate-400 mt-1 leading-relaxed">
                  {lang === 'es'
                    ? 'El sistema notifica automáticamente al primer paciente en espera cuando se libera un turno. Si está desactivado, la secretaria lo gestiona manualmente desde el dashboard.'
                    : lang === 'it'
                    ? 'Il sistema notifica automaticamente il primo paziente in lista quando si libera un appuntamento. Se disattivato, la segretaria lo gestisce manualmente.'
                    : 'The system automatically notifies the first waiting patient when a slot opens. If disabled, the secretary manages it manually from the dashboard.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWaitlistAutoNotify(v => !v)}
                className={`relative shrink-0 inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                  waitlistAutoNotify ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                  waitlistAutoNotify ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Timeout minutes - only relevant when auto is ON */}
            {waitlistAutoNotify && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2">
                  {lang === 'es' ? 'Tiempo de respuesta (minutos)' : lang === 'it' ? 'Tempo di risposta (minuti)' : 'Response time (minutes)'}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={5} max={120} step={5}
                    value={waitlistOfferTimeout}
                    onChange={e => setWaitlistOfferTimeout(Number(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="shrink-0 w-16 text-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm font-black text-slate-900 dark:text-white">
                    {waitlistOfferTimeout} min
                  </span>
                </div>
                <p className="text-[10px] font-medium text-slate-400 mt-2">
                  {lang === 'es'
                    ? `Si el paciente no responde en ${waitlistOfferTimeout} minutos, el turno se ofrece al siguiente en la lista.`
                    : lang === 'it'
                    ? `Se il paziente non risponde entro ${waitlistOfferTimeout} minuti, il turno viene offerto al successivo in lista.`
                    : `If the patient doesn't respond within ${waitlistOfferTimeout} minutes, the slot is offered to the next patient on the list.`}
                </p>
              </div>
            )}

            {waitlistMessage && (
              <div className={`p-4 rounded-xl text-xs font-bold border ${
                waitlistMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>
                {waitlistMessage.text}
              </div>
            )}
            <button
              type="submit"
              disabled={isSavingWaitlist}
              className="w-full bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 disabled:opacity-50 transition-all text-white dark:text-slate-900 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-lg active:scale-95"
            >
              {isSavingWaitlist ? '...' : t.save_config}
            </button>
          </form>
        </div>
        )}

        {/* Change Password - Always show for everyone (if not google user) */}
        {!isGoogleUser && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-900/5 p-6 md:p-10 transition-all hover:shadow-indigo-900/10">
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
        )}

        {/* Guides & Support */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-900/5 p-6 md:p-10 transition-all hover:shadow-indigo-900/10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 7v5"/><path d="M12 16h.01"/></svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {lang === 'es' ? 'Ayuda y Tutoriales' : (lang === 'it' ? 'Aiuto e Tutorial' : 'Help & Tutorials')}
            </h3>
          </div>
          <div className="space-y-6">
            <p className="text-xs font-semibold text-slate-400 leading-relaxed uppercase tracking-wider">
              {lang === 'es' ? 'Si necesitas repasar el funcionamiento de la plataforma, puedes reiniciar el tour interactivo.' : 
               (lang === 'it' ? 'Se hai bisogno di ripassare il funzionamento della piattaforma, puoi riavviare il tour interattivo.' : 
               'If you need to review how the platform works, you can restart the interactive tour.')}
            </p>
            <button
              onClick={handleRestartTutorial}
              className="w-full bg-slate-100 hover:bg-orange-500 hover:text-white dark:bg-slate-800 dark:hover:bg-orange-500 transition-all text-slate-700 dark:text-slate-300 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] shadow-sm active:scale-95"
            >
              {t.onboarding.restart_tutorial}
            </button>
          </div>
        </div>

        {/* Danger Zone - Only for admin/owner */}
        {(userRole === 'admin' || userRole === 'tenant_admin' || userRole === 'owner') && (
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] border-2 border-red-200 dark:border-red-900/50 shadow-xl shadow-red-900/5 p-6 md:p-10 transition-all">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-red-600 dark:text-red-400 uppercase tracking-tight">
                    {lang === 'es' ? 'Zona de Peligro' : (lang === 'it' ? 'Zona di Pericolo' : 'Danger Zone')}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                    {lang === 'es' ? 'Acciones irreversibles' : (lang === 'it' ? 'Azioni irreversibili' : 'Irreversible actions')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDangerZone(!showDangerZone)}
                className="text-xs font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {showDangerZone
                  ? (lang === 'es' ? 'Ocultar' : (lang === 'it' ? 'Nascondi' : 'Hide'))
                  : (lang === 'es' ? 'Mostrar opciones' : (lang === 'it' ? 'Mostra opzioni' : 'Show options'))}
              </button>
            </div>

            {showDangerZone && (
              <div className="space-y-6 border-t border-red-100 dark:border-red-900/30 pt-6">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-5 border border-red-100 dark:border-red-900/30">
                  <h4 className="text-sm font-black text-red-700 dark:text-red-400 mb-2">
                    {lang === 'es' ? 'Eliminar Cuenta del Tenant' : (lang === 'it' ? 'Elimina Account Tenant' : 'Delete Tenant Account')}
                  </h4>
                  <p className="text-xs font-medium text-red-600/80 dark:text-red-400/80 mb-5 leading-relaxed">
                    {lang === 'es'
                      ? 'Esta acción eliminará permanentemente tu cuenta, todos los pacientes, citas, profesionales y datos de la clínica. Esta acción NO se puede deshacer.'
                      : lang === 'it'
                      ? 'Questa azione eliminerà permanentemente il tuo account, tutti i pazienti, appuntamenti, professionisti e dati della clinica. Questa azione NON può essere annullata.'
                      : 'This action will permanently delete your account, all patients, appointments, professionals, and clinic data. This action CANNOT be undone.'}
                  </p>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">
                      {lang === 'es' ? 'Escribe ELIMINAR para confirmar' : (lang === 'it' ? 'Scrivi ELIMINA per confermare' : 'Type DELETE to confirm')}
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={lang === 'es' ? 'ELIMINAR' : (lang === 'it' ? 'ELIMINA' : 'DELETE')}
                      className="block w-full rounded-2xl border-none ring-2 ring-red-200 dark:ring-red-800 bg-white dark:bg-slate-900 py-4 px-5 text-sm font-bold text-red-700 dark:text-red-400 focus:ring-red-400 transition-all appearance-none outline-none placeholder-red-200 dark:placeholder-red-900"
                    />
                    <button
                      onClick={handleDeleteTenant}
                      disabled={
                        isDeletingTenant ||
                        deleteConfirmText !== (lang === 'it' ? 'ELIMINA' : lang === 'en' ? 'DELETE' : 'ELIMINAR')
                      }
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-200 dark:disabled:bg-red-900/30 disabled:cursor-not-allowed transition-all text-white disabled:text-red-400 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isDeletingTenant ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> {lang === 'es' ? 'Eliminando...' : (lang === 'it' ? 'Eliminazione...' : 'Deleting...')}</>
                      ) : (
                        <><AlertTriangle className="h-4 w-4" /> {lang === 'es' ? 'Eliminar Cuenta Permanentemente' : (lang === 'it' ? 'Elimina Account Definitivamente' : 'Delete Account Permanently')}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
      
      {isDeleted && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-500 border border-slate-200 dark:border-white/5">
            <div className="h-20 w-20 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
              {lang === 'es' ? 'Cuenta Eliminada' : (lang === 'it' ? 'Account Eliminato' : 'Account Deleted')}
            </h2>
            <p className="text-slate-500 font-medium mb-8">
              {lang === 'es' ? 'Tu clínica y todos sus datos han sido borrados permanentemente. Esperamos verte pronto.' : (lang === 'it' ? 'La tua clinica e tutti i suoi dati sono stati cancellati in modo permanente. Speriamo di rivederti presto.' : 'Your clinic and all its data have been permanently deleted. We hope to see you soon.')}
            </p>
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
