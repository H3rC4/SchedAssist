"use client"

import { useEffect, useState } from 'react'
import { KeyRound, Eye, EyeOff, Languages, Upload, Image as ImageIcon, Loader2 } from 'lucide-react'
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
    } else {
      setLang(selectedLang)
      setTenantSettings(newSettings)
      setLangMessage({ text: t.config_saved, type: 'success' })
    }
    setIsSavingLang(false)
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
    setIsSavingLang(true) // Reuse simple loading state or add one
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

      </div>
    </div>
  )
}
