"use client"

import { useEffect, useState } from 'react'
import { KeyRound, Eye, EyeOff, Languages, Upload, Image as ImageIcon, Loader2, AlertTriangle, Clock, ListOrdered, Settings, Sparkles, Building2, Globe, ShieldAlert, LifeBuoy, ArrowRight, CheckCircle } from 'lucide-react'
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
  const [primaryColor, setPrimaryColor] = useState('#005c55') // Oasis Precision Primary
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
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [isSavingWaitlist, setIsSavingWaitlist] = useState(false)
  const [waitlistMessage, setWaitlistMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const t = translations[lang] || translations['en']

  useEffect(() => {
    const supabase = createClient()
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

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
        setPrimaryColor(tenant.settings?.primary_color || '#005c55')
        setCustomDomain(tenant.settings?.custom_domain || '')
        setWaitlistAutoNotify(tenant.settings?.waitlist_auto_notify !== false)
        setWaitlistOfferTimeout(tenant.settings?.waitlist_offer_timeout_minutes ?? 30)
        setReminderEnabled(tenant.settings?.reminder_enabled !== false)
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
      reminder_enabled: reminderEnabled,
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

  const isTenantAdmin = userRole === 'admin' || userRole === 'tenant_admin' || userRole === 'owner'

  return (
    <div className="flex-1 min-h-screen bg-surface p-6 md:p-16 lg:p-24 animate-in fade-in duration-1000 overflow-x-hidden">
      
      {/* MASSIVE EDITORIAL HEADER */}
      <div className="mb-24 md:mb-32">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-2 w-12 bg-primary rounded-full" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">
            {t.account_administration || 'ADMINISTRACIÓN'}
          </p>
        </div>
        <h1 className="text-7xl md:text-8xl lg:text-[10rem] font-black text-slate-900 tracking-[0.1em] md:tracking-[-0.05em] leading-[0.8] uppercase break-words">
          {t.system_settings}
        </h1>
        <div className="mt-12 max-w-2xl">
          <p className="text-lg font-medium text-slate-500 leading-relaxed">
            Controla cada detalle de tu plataforma. Desde la estética visual hasta la lógica automatizada de la lista de espera.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* LEFT COLUMN - ASYMMETRIC */}
        <div className="lg:col-span-7 space-y-12">
          
          {/* CLINIC SETTINGS CARD */}
          {isTenantAdmin && (
            <div className="bg-surface-container-lowest rounded-[3rem] border border-slate-100 shadow-spatial p-8 md:p-16">
              <div className="flex items-start justify-between mb-16">
                <div className="space-y-4">
                  <div className="h-16 w-16 rounded-[1.5rem] bg-amber-50 flex items-center justify-center text-amber-500 shadow-ambient">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
                    {t.clinic_settings_title}
                  </h2>
                </div>
              </div>

              <form onSubmit={handleSaveClinic} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      {lang === 'es' ? 'Teléfono de Contacto' : (lang === 'it' ? 'Telefono di Contatto' : 'Contact Phone')}
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+54 9 11 ..."
                      className="w-full h-16 bg-slate-50 rounded-3xl border-2 border-transparent px-8 font-black text-slate-900 focus:bg-white focus:border-primary transition-all shadow-inner outline-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      {lang === 'es' ? 'Color Primario' : (lang === 'it' ? 'Colore Primario' : 'Primary Color')}
                    </label>
                    <div className="flex gap-4">
                      <div className="relative">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="h-16 w-24 rounded-3xl border-2 border-slate-100 p-1 cursor-pointer bg-white"
                        />
                      </div>
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 h-16 bg-slate-50 rounded-3xl border-2 border-transparent px-8 font-black text-slate-900 focus:bg-white focus:border-primary transition-all shadow-inner outline-none uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Dominio Personalizado
                  </label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded tracking-tighter uppercase">PORTAL</div>
                    <input
                      type="text"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="ej: citas.tuclinica.com"
                      className="w-full h-16 bg-slate-50 rounded-3xl border-2 border-transparent pl-24 pr-8 font-black text-slate-900 focus:bg-white focus:border-primary transition-all shadow-inner outline-none"
                    />
                  </div>
                </div>

                {/* LOGO UPLOAD AREA */}
                <div className="p-8 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 transition-all group hover:border-primary">
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="h-40 w-40 rounded-3xl bg-white shadow-spatial border border-slate-100 flex items-center justify-center relative overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-4" />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-slate-200" />
                      )}
                      {isUploadingLogo && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-6 text-center md:text-left">
                      <div className="space-y-2">
                        <p className="text-xl font-black text-slate-900 tracking-tight">IDENTIDAD VISUAL</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Formatos PNG, JPG o SVG (Máx 2MB)</p>
                      </div>
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
                          className="flex items-center gap-3 px-10 py-4 bg-white border-2 border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-ambient transition-all hover:border-primary group-active:scale-95"
                        >
                          <Upload className="h-5 w-5 text-primary" />
                          {isUploadingLogo ? t.uploading : t.upload_logo}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {clinicMessage && (
                  <div className={`p-6 rounded-[1.5rem] text-sm font-black border animate-in slide-in-from-bottom duration-500
                    ${clinicMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}
                  `}>
                    {clinicMessage.text}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isSavingClinic}
                  className="w-full h-20 bg-primary hover:bg-slate-900 disabled:opacity-50 transition-all text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-spatial active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {isSavingClinic ? <Loader2 className="h-6 w-6 animate-spin" /> : <><CheckCircle className="h-6 w-6" /> {t.save_config}</>}
                </button>
              </form>
            </div>
          )}

          {/* PASSWORD CHANGE AREA */}
          {!isGoogleUser && (
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-spatial p-8 md:p-16">
              <div className="flex items-center gap-6 mb-12">
                <div className="h-16 w-16 rounded-[1.5rem] bg-violet-50 flex items-center justify-center text-violet-500 shadow-ambient">
                  <KeyRound className="h-8 w-8" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
                  {t.change_password}
                </h2>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      {t.new_password}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-16 bg-slate-50 rounded-3xl border-2 border-transparent px-8 font-black text-slate-900 focus:bg-white focus:border-primary transition-all shadow-inner outline-none pr-16"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      {t.confirm_password}
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-16 bg-slate-50 rounded-3xl border-2 border-transparent px-8 font-black text-slate-900 focus:bg-white focus:border-primary transition-all shadow-inner outline-none"
                      required
                    />
                  </div>
                </div>

                {passwordMessage && (
                  <div className={`p-6 rounded-[1.5rem] text-sm font-black border
                    ${passwordMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}
                  `}>
                    {passwordMessage.text}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isUpdatingPassword || !password || !confirmPassword}
                  className="w-full h-20 bg-slate-900 hover:bg-primary disabled:opacity-50 transition-all text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-spatial active:scale-[0.98]"
                >
                  {isUpdatingPassword ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : t.update}
                </button>
              </form>
            </div>
          )}

          {/* DANGER ZONE SECTION */}
          {isTenantAdmin && (
            <div className="bg-red-50/50 rounded-[3rem] border-2 border-red-100 p-8 md:p-16">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-[1.5rem] bg-red-100 flex items-center justify-center text-red-600 shadow-ambient">
                    <ShieldAlert className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-4xl font-black text-red-600 tracking-tight uppercase leading-none">
                      {lang === 'es' ? 'Zona Crítica' : (lang === 'it' ? 'Zona Critica' : 'Danger Zone')}
                    </h2>
                    <p className="text-xs font-black text-red-400 uppercase tracking-widest pl-1">ACCIONES IRREVERSIBLES</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDangerZone(!showDangerZone)}
                  className="px-8 py-3 bg-white border-2 border-red-200 rounded-full text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-ambient active:scale-95"
                >
                  {showDangerZone ? 'OCULTAR' : 'VER OPCIONES'}
                </button>
              </div>

              {showDangerZone && (
                <div className="animate-in slide-in-from-top duration-500 space-y-8 border-t border-red-200/50 pt-12 mt-12">
                  <div className="bg-white rounded-[2rem] p-8 md:p-12 border-2 border-red-100 shadow-spatial space-y-8">
                    <div className="space-y-4">
                      <h4 className="text-2xl font-black text-slate-900 tracking-tight uppercase">ELIMINAR CLINICA Y DATOS</h4>
                      <p className="text-slate-500 font-medium leading-relaxed">
                        {lang === 'es'
                          ? 'Esta acción eliminará permanentemente tu cuenta, todos los pacientes, citas, profesionales y datos de la clínica. Esta acción NO se puede deshacer.'
                          : lang === 'it'
                          ? 'Questa azione eliminerà permanentemente il tuo account, tutti i pazienti, appuntamenti, professionisti e dati della clinica. Questa azione NON può essere annullata.'
                          : 'This action will permanently delete your account, all patients, appointments, professionals, and clinic data. This action CANNOT be undone.'}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] ml-1">
                        Escribe <span className="underline">{lang === 'it' ? 'ELIMINA' : (lang === 'en' ? 'DELETE' : 'ELIMINAR')}</span> para confirmar
                      </label>
                      <div className="flex flex-col md:flex-row gap-4">
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder={lang === 'es' ? 'ELIMINAR' : (lang === 'it' ? 'ELIMINA' : 'DELETE')}
                          className="flex-1 h-16 bg-red-50 rounded-3xl border-2 border-transparent px-8 font-black text-red-600 focus:bg-white focus:border-red-600 transition-all outline-none"
                        />
                        <button
                          onClick={handleDeleteTenant}
                          disabled={
                            isDeletingTenant ||
                            deleteConfirmText !== (lang === 'it' ? 'ELIMINA' : lang === 'en' ? 'DELETE' : 'ELIMINAR')
                          }
                          className="h-16 px-12 bg-red-600 hover:bg-slate-900 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all text-white rounded-3xl text-xs font-black uppercase tracking-widest shadow-spatial active:scale-95 flex items-center justify-center gap-3"
                        >
                          {isDeletingTenant ? <Loader2 className="h-5 w-5 animate-spin" /> : <><AlertTriangle className="h-5 w-5" /> ELIMINAR AHORA</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN - ASYMMETRIC (Sticky if content allows) */}
        <div className="lg:col-span-5 space-y-12 lg:sticky lg:top-24">
          
          {/* WAITLIST CONFIGURATION CARD */}
          {isTenantAdmin && (
            <div className="bg-surface-container-lowest rounded-[3rem] border border-slate-100 shadow-spatial p-8 md:p-12">
              <div className="flex items-center gap-6 mb-12">
                <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-ambient">
                  <ListOrdered className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
                    {lang === 'es' ? 'Waitlist' : lang === 'it' ? "Attesa" : 'Waitlist'}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AUTOMATIZACIÓN</p>
                </div>
              </div>

              <form onSubmit={handleSaveWaitlistSettings} className="space-y-10">
                
                {/* AUTO NOTIFY TOGGLE */}
                <div 
                  className={`p-8 rounded-[2rem] border-2 transition-all cursor-pointer select-none
                    ${waitlistAutoNotify ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50/50'}
                  `}
                  onClick={() => setWaitlistAutoNotify(v => !v)}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="space-y-3">
                      <p className={`text-lg font-black uppercase tracking-tight ${waitlistAutoNotify ? 'text-primary' : 'text-slate-900'}`}>
                        {lang === 'es' ? 'Notificación automática' : lang === 'it' ? 'Notifica automatica' : 'Auto Notification'}
                      </p>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed">
                        {lang === 'es'
                          ? 'El sistema ofrece automáticamente los turnos liberados al primer paciente en espera.'
                          : lang === 'it'
                          ? 'Il sistema offre automaticamente gli appuntamenti liberi al primo paziente in lista.'
                          : 'System automatically offers open slots to the first patient on the waitlist.'}
                      </p>
                    </div>
                    <div className={`shrink-0 h-8 w-14 rounded-full transition-all flex items-center px-1 
                      ${waitlistAutoNotify ? 'bg-primary' : 'bg-slate-200'}
                    `}>
                      <div className={`h-6 w-6 rounded-full bg-white shadow-md transition-all 
                        ${waitlistAutoNotify ? 'translate-x-6' : 'translate-x-0'}
                      `} />
                    </div>
                  </div>
                </div>

                {/* REMINDERS TOGGLE */}
                <div 
                  className={`p-8 rounded-[2rem] border-2 transition-all cursor-pointer select-none
                    ${reminderEnabled ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50/50'}
                  `}
                  onClick={() => setReminderEnabled(v => !v)}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="space-y-3">
                      <p className={`text-lg font-black uppercase tracking-tight ${reminderEnabled ? 'text-primary' : 'text-slate-900'}`}>
                        {lang === 'es' ? 'Recordatorios (WhatsApp)' : lang === 'it' ? 'Promemoria' : 'Reminders'}
                      </p>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed">
                        Envía confirmaciones automáticas vía WhatsApp 24 horas antes de cada cita.
                      </p>
                    </div>
                    <div className={`shrink-0 h-8 w-14 rounded-full transition-all flex items-center px-1 
                      ${reminderEnabled ? 'bg-primary' : 'bg-slate-200'}
                    `}>
                      <div className={`h-6 w-6 rounded-full bg-white shadow-md transition-all 
                        ${reminderEnabled ? 'translate-x-6' : 'translate-x-0'}
                      `} />
                    </div>
                  </div>
                </div>

                {/* TIMEOUT SLIDER */}
                {waitlistAutoNotify && (
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                        TIEMPO DE RESPUESTA
                      </label>
                      <span className="text-2xl font-black text-primary">{waitlistOfferTimeout} MIN</span>
                    </div>
                    <input
                      type="range"
                      min={5} max={120} step={5}
                      value={waitlistOfferTimeout}
                      onChange={e => setWaitlistOfferTimeout(Number(e.target.value))}
                      className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                      PLAZO PARA CONFIRMAR ANTES DE PASAR AL SIGUIENTE
                    </p>
                  </div>
                )}

                {waitlistMessage && (
                  <div className={`p-6 rounded-2xl text-sm font-black border animate-in slide-in-from-bottom duration-500
                    ${waitlistMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}
                  `}>
                    {waitlistMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSavingWaitlist}
                  className="w-full h-20 bg-slate-900 hover:bg-primary disabled:opacity-50 transition-all text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-spatial active:scale-[0.98]"
                >
                  {isSavingWaitlist ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : 'GUARDAR CAMBIOS'}
                </button>
              </form>
            </div>
          )}

          {/* LANGUAGE SETTINGS CARD */}
          {isTenantAdmin && (
            <div className="bg-surface-container-lowest rounded-[3rem] border border-slate-100 shadow-spatial p-8 md:p-12">
              <div className="flex items-center gap-6 mb-12">
                <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-900 shadow-ambient">
                  <Globe className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
                    {t.language_settings}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LOCALIZACIÓN</p>
                </div>
              </div>

              <form onSubmit={handleSaveLanguage} className="space-y-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    {t.system_language}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedLang}
                      onChange={(e) => setSelectedLang(e.target.value as Language)}
                      className="w-full h-16 bg-slate-50 rounded-3xl border-2 border-transparent px-8 font-black text-slate-900 text-lg focus:bg-white focus:border-primary transition-all shadow-inner outline-none appearance-none"
                    >
                      <option value="en">ENGLISH (US)</option>
                      <option value="es">ESPAÑOL</option>
                      <option value="it">ITALIANO</option>
                    </select>
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ArrowRight className="h-6 w-6 text-slate-300 rotate-90" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingLang}
                  className="w-full h-20 bg-slate-900 hover:bg-primary disabled:opacity-50 transition-all text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-spatial active:scale-[0.98]"
                >
                  {isSavingLang ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : t.save_config}
                </button>
              </form>
            </div>
          )}

          {/* HELP & SUPPORT MINI CARD */}
          <div className="bg-slate-50 rounded-[3rem] border border-slate-100 p-10 flex flex-col items-center text-center space-y-8">
            <div className="h-20 w-20 rounded-[2rem] bg-white flex items-center justify-center text-primary shadow-spatial">
              <LifeBuoy className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">¿NECESITAS AYUDA?</h3>
              <p className="text-sm font-medium text-slate-500">Repasa las funciones de la plataforma reiniciando el tour.</p>
            </div>
            <button
              onClick={handleRestartTutorial}
              className="px-12 py-5 bg-white border-2 border-slate-100 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 shadow-ambient hover:border-primary transition-all active:scale-95"
            >
              REINICIAR TUTORIAL
            </button>
          </div>

        </div>

      </div>

      {/* DELETE SUCCESS MODAL */}
      {isDeleted && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[4rem] p-16 max-w-xl w-full text-center shadow-spatial animate-in zoom-in-95 duration-700 border border-slate-100">
            <div className="h-32 w-32 bg-red-50 rounded-[3rem] flex items-center justify-center mx-auto mb-12 shadow-ambient">
              <AlertTriangle className="h-16 w-16 text-red-600" />
            </div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-6 leading-none">
              CUENTA ELIMINADA
            </h2>
            <p className="text-lg font-medium text-slate-500 mb-12 leading-relaxed">
              Tu clínica y todos sus datos han sido borrados permanentemente. Esperamos verte pronto.
            </p>
            <div className="flex justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
