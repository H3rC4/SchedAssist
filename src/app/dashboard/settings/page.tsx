'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, KeyRound, Globe, Upload, Image as ImageIcon, Loader2, CheckCircle, Eye, EyeOff, ArrowRight, Sparkles, RotateCcw, AlertCircle, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { translations, Language } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';

export default function GeneralSettingsPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('es');
  const [tenantId, setTenantId] = useState('');
  const [tenantSettings, setTenantSettings] = useState<any>({});
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [contactPhone, setContactPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#005c55');
  const [selectedLang, setSelectedLang] = useState<Language>('es');
  const [countryCode, setCountryCode] = useState<string>('54');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Tutorial state
  const [isRestartingTutorial, setIsRestartingTutorial] = useState(false);
  const [tutorialResetMessage, setTutorialResetMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const t = (translations[lang] || translations['es']) as any;

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Guard: secretary cannot access settings
      const { data: tuData } = await supabase
        .from('tenant_users')
        .select('role, tenant_id, tenants(*)')
        .eq('user_id', user.id)
        .single();

      if (tuData?.role === 'secretary') {
        router.replace('/dashboard');
        return;
      }

      setIsGoogleUser(user.app_metadata.provider === 'google' || !!user.identities?.some(id => id.provider === 'google'));

      if (tuData?.tenants) {
        const tenant = tuData.tenants as any;
        setTenantId(tenant.id);
        const s = tenant.settings || {};
        setTenantSettings(s);
        setLang(s.language || 'es');
        setSelectedLang(s.language || 'es');
        setCountryCode(s.default_country_code || '54');
        setContactPhone(s.contact_phone || '');
        setLogoUrl(s.logo_url || '');
        setPrimaryColor(s.primary_color || '#005c55');
      }
      setIsLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    const supabase = createClient();
    
    const newSettings = { 
      ...tenantSettings, 
      contact_phone: contactPhone,
      logo_url: logoUrl,
      primary_color: primaryColor,
      language: selectedLang,
      default_country_code: countryCode
    };

    const { error } = await supabase
      .from('tenants')
      .update({ settings: newSettings })
      .eq('id', tenantId);

    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: t.config_saved || 'Configurazione salvata!', type: 'success' });
      if (selectedLang !== lang) {
        window.location.reload();
      }
    }
    setIsSaving(false);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    
    if (!password || password.length < 6) {
      setPasswordError(t.password_length || 'La password deve essere di almeno 6 caratteri.');
      return;
    }
    
    if (password !== confirmPassword) {
      setPasswordError(t.passwords_mismatch || 'Le password non coincidono.');
      return;
    }

    setIsChangingPassword(true);
    const supabase = createClient();
    
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      setPasswordError(error.message);
    } else {
      setPassword('');
      setConfirmPassword('');
      setPasswordError(null);
      setMessage({ text: t.password_updated || 'Password aggiornata con successo!', type: 'success' });
    }
    setIsChangingPassword(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    const supabase = createClient();
    try {
      const fileName = `${tenantId}-${Date.now()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('logos').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
      setLogoUrl(publicUrl);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRestartTutorial = async () => {
    setIsRestartingTutorial(true);
    setTutorialResetMessage(null);
    try {
      const res = await fetch('/api/tenant/tutorial/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId })
      });
      const data = await res.json();
      if (data.success) {
        setTutorialResetMessage({ text: t.tutorial_reset_success, type: 'success' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setTutorialResetMessage({ text: t.tutorial_reset_error, type: 'error' });
      }
    } catch (err: any) {
      setTutorialResetMessage({ text: t.tutorial_reset_error, type: 'error' });
    } finally {
      setIsRestartingTutorial(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Form field definition for the planilla layout
  const formFields = [
    {
      id: 'contact_phone',
      label: t.contact_phone,
      description: t.contact_phone_desc,
      content: (
        <input
          type="text"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          className="w-full h-14 bg-primary/[0.04] rounded-xl border border-primary/10 px-5 font-bold text-on-surface text-sm placeholder:text-primary/20 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
          placeholder="+39 345 678 9012"
        />
      )
    },
    {
      id: 'primary_color',
      label: t.primary_color,
      description: null,
      content: (
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-xl border-2 border-primary/20 p-1 bg-white overflow-hidden cursor-pointer hover:border-primary transition-colors">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="absolute inset-[-10px] w-[calc(100%+20px)] h-[calc(100%+20px)] cursor-pointer"
            />
          </div>
          <input
            type="text"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="flex-1 h-14 bg-primary/[0.04] rounded-xl border border-primary/10 px-5 font-bold text-on-surface text-sm uppercase font-mono focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
          />
        </div>
      )
    },
    {
      id: 'language',
      label: t.system_language_label,
      description: null,
      content: (
        <div className="relative">
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as Language)}
            className="w-full h-14 bg-primary/[0.04] rounded-xl border border-primary/10 px-5 pr-12 font-bold text-on-surface text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
          >
            <option value="en">{t.language_en}</option>
            <option value="es">{t.language_es}</option>
            <option value="it">{t.language_it}</option>
          </select>
          <Globe className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 pointer-events-none" />
        </div>
      )
    },
    {
      id: 'country',
      label: lang === 'es' ? 'País' : lang === 'it' ? 'Paese' : 'Country',
      description: lang === 'es' ? 'Determina el prefijo telefónico para números de pacientes' : lang === 'it' ? 'Determina il prefisso telefonico per i numeri dei pazienti' : 'Determines the phone prefix for patient numbers',
      content: (
        <div className="relative">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full h-14 bg-primary/[0.04] rounded-xl border border-primary/10 px-5 pr-12 font-bold text-on-surface text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
          >
            <option value="54">Argentina (+54)</option>
            <option value="34">España (+34)</option>
            <option value="39">Italia (+39)</option>
            <option value="1">Estados Unidos (+1)</option>
            <option value="52">México (+52)</option>
            <option value="57">Colombia (+57)</option>
            <option value="56">Chile (+56)</option>
            <option value="44">Reino Unido (+44)</option>
          </select>
          <Globe className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 pointer-events-none" />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="relative">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -z-10" />
        <h1 className="text-2xl md:text-4xl font-black text-on-surface tracking-tighter uppercase mb-3">
          {t.general_settings?.split(' ')[0]} <span className="text-primary italic font-serif lowercase">{t.general_settings?.split(' ').slice(1).join(' ')}</span>
        </h1>
        <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.4em] ml-1">
          {t.clinic_identity_desc}
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Main Planilla Card */}
        <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-primary/10 shadow-spatial overflow-hidden">
          {/* Card Header */}
          <div className="px-6 md:px-10 py-6 md:py-8 border-b border-primary/5 bg-primary/[0.02]">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Building2 className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-on-surface uppercase tracking-tight">{t.clinic_identity}</h2>
                <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.3em] mt-1">{t.clinic_identity_desc}</p>
              </div>
            </div>
          </div>

          {/* Form Fields as List */}
          <div className="divide-y divide-primary/5">
            {formFields.map((field) => (
              <div key={field.id} className="px-6 md:px-10 py-6 md:py-8 hover:bg-primary/[0.01] transition-colors">
                <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
                  {/* Label Column */}
                  <div className="md:w-64 md:pt-1 flex-shrink-0">
                    <label className="text-[10px] font-black text-primary/70 uppercase tracking-[0.3em] block">
                      {field.label}
                    </label>
                    {field.description && (
                      <p className="text-[9px] font-bold text-on-surface/30 mt-1.5 leading-relaxed max-w-xs">
                        {field.description}
                      </p>
                    )}
                  </div>
                  {/* Input Column */}
                  <div className="flex-1 max-w-lg">
                    {field.content}
                  </div>
                </div>
              </div>
            ))}

            {/* Logo Row */}
            <div className="px-6 md:px-10 py-6 md:py-8 hover:bg-primary/[0.01] transition-colors">
              <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
                <div className="md:w-64 md:pt-1 flex-shrink-0">
                  <label className="text-[10px] font-black text-primary/70 uppercase tracking-[0.3em] block">
                    {t.clinic_logo}
                  </label>
                  <p className="text-[9px] font-bold text-on-surface/30 mt-1.5 leading-relaxed max-w-xs">
                    {t.recommended_logo}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-primary/[0.04] border-2 border-dashed border-primary/15 flex items-center justify-center relative overflow-hidden group/logo hover:border-primary/30 transition-all">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-14 w-14 md:h-16 md:w-16 object-contain p-2" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-primary/20" />
                      )}
                      {isUploadingLogo && (
                        <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        disabled={isUploadingLogo}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-on-surface/50">{t.upload_logo}</p>
                      <p className="text-[9px] font-bold text-on-surface/30">512x512 PNG consigliato</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button at the Bottom */}
          <div className="px-6 md:px-10 py-6 md:py-8 border-t border-primary/5 bg-primary/[0.02]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-widest ${
                      message.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      message.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'
                    }`}>
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>
              {!message && <div />}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto h-14 px-10 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-[0.4em] shadow-xl shadow-primary/20 hover:bg-primary-light hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{t.save_changes}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Password Section */}
        {!isGoogleUser && (
          <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-primary/10 shadow-spatial overflow-hidden">
            <div className="px-6 md:px-10 py-6 md:py-8 border-b border-primary/5 bg-primary/[0.02]">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <KeyRound className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black text-on-surface uppercase tracking-tight">{t.change_password}</h2>
                  <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.3em] mt-1">{t.security_settings || 'Gestione della sicurezza dell\'account'}</p>
                </div>
              </div>
            </div>

            <div className="px-6 md:px-10 py-6 md:py-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-1">{t.new_password_label}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-14 bg-primary/[0.04] rounded-xl border border-primary/10 px-5 pr-12 font-bold text-on-surface text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/30 hover:text-primary transition-colors">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-1">{t.confirm_password_label}</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-14 bg-primary/[0.04] rounded-xl border border-primary/10 px-5 font-bold text-on-surface text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <AnimatePresence>
                {passwordError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {passwordError}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="h-12 px-8 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-[0.4em] shadow-xl shadow-primary/20 hover:bg-primary-light hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isChangingPassword ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>{t.change_password}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        )}
      </form>

      {/* Restart Tutorial Section */}
      <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-primary/10 p-6 md:p-10 shadow-spatial relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none select-none group-hover:opacity-[0.05] transition-opacity">
          <Sparkles className="h-48 w-48 text-primary" />
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-12 relative z-10">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-xl shadow-primary/10 group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="h-8 w-8 md:h-10 md:w-10 text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-black text-on-surface uppercase tracking-tight mb-3">
              {t.tutorial_title}
            </h2>
            <p className="text-sm text-on-surface/50 font-medium mb-6 leading-relaxed max-w-2xl">
              {t.tutorial_desc}
            </p>

            <AnimatePresence>
              {tutorialResetMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`mb-6 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border inline-flex items-center gap-3 ${
                    tutorialResetMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-red-50 text-red-600 border-red-200'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    tutorialResetMessage.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  {tutorialResetMessage.text}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleRestartTutorial}
              disabled={isRestartingTutorial}
              className="h-12 px-8 bg-primary/5 text-primary rounded-xl text-xs font-black uppercase tracking-[0.4em] hover:bg-primary hover:text-white hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 group/btn"
            >
              {isRestartingTutorial ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 group-hover/btn:rotate-180 transition-transform duration-700" />
                  <span>{t.restart_tutorial}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
