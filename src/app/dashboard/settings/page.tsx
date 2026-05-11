'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, KeyRound, Globe, Upload, Image as ImageIcon, Loader2, CheckCircle, Eye, EyeOff, ArrowRight, Sparkles, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { translations, Language } from '@/lib/i18n';
import { motion } from 'framer-motion';

export default function GeneralSettingsPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('es');
  const [tenantId, setTenantId] = useState('');
  const [tenantSettings, setTenantSettings] = useState<any>({});
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  
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
      setMessage({ text: t.config_saved || 'Config saved', type: 'success' });
      if (selectedLang !== lang) {
        window.location.reload();
      }
    }
    setIsSaving(false);
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

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="relative">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -z-10" />
        <h1 className="text-2xl md:text-4xl font-black text-on-surface tracking-tighter uppercase mb-3">
          {t.general_settings?.split(' ')[0]} <span className="text-primary italic font-serif lowercase">{t.general_settings?.split(' ').slice(1).join(' ')}</span>
        </h1>
        <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.4em] ml-1">
          {t.clinic_identity_desc}
        </p>
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        {/* Left: Clinic Info */}
        <div className="lg:col-span-7 space-y-6 md:space-y-8">
          <section className="bg-white rounded-[1.5rem] md:rounded-[3rem] border border-primary/10 p-6 md:p-10 shadow-spatial relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none select-none group-hover:opacity-[0.05] transition-opacity">
              <Building2 className="h-24 w-24 text-primary" />
            </div>

            <div className="flex items-center gap-4 mb-6 md:mb-10">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Building2 className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <h2 className="text-lg md:text-xl font-black text-on-surface uppercase tracking-tight">{t.clinic_identity}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              <div className="space-y-3 md:space-y-4">
                <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">{t.contact_phone}</label>
                <div className="relative group/input">
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full h-12 md:h-16 bg-primary/[0.06] rounded-2xl border border-primary/20 px-4 md:px-6 font-bold text-on-surface focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>
              <div className="space-y-3 md:space-y-4">
                <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">{t.primary_color}</label>
                <div className="flex flex-nowrap gap-3">
                  <div className="relative h-12 w-12 md:h-16 md:w-16 flex-shrink-0 rounded-2xl border-2 border-primary/20 p-1 bg-white overflow-hidden group/color">
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
                    className="flex-1 min-w-0 h-12 md:h-16 bg-primary/[0.06] rounded-2xl border border-primary/20 px-4 md:px-6 font-bold text-on-surface focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none uppercase font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4 mt-6 md:mt-10">
              <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">{t.system_language_label}</label>
              <div className="relative">
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value as Language)}
                  className="w-full h-12 md:h-16 bg-primary/[0.06] rounded-2xl border border-primary/20 px-4 md:px-6 font-bold text-on-surface focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="en">{t.language_en}</option>
                  <option value="es">{t.language_es}</option>
                  <option value="it">{t.language_it}</option>
                </select>
                <Globe className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-3 md:space-y-4 mt-6 md:mt-10">
              <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">
                {lang === 'es' ? 'País' : lang === 'it' ? 'Paese' : 'Country'}
              </label>
              <div className="relative">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full h-12 md:h-16 bg-primary/[0.06] rounded-2xl border border-primary/20 px-4 md:px-6 font-bold text-on-surface focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
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
                <Globe className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 pointer-events-none" />
              </div>
              <p className="text-[9px] font-bold text-on-surface-muted ml-2">
                {lang === 'es' ? 'Determina el prefijo telefónico para números de pacientes' : lang === 'it' ? "Determina il prefisso telefonico per i numeri dei pazienti" : 'Determines the phone prefix for patient numbers'}
              </p>
            </div>
          </section>

          {/* Password Security */}
          {!isGoogleUser && (
            <section className="bg-white rounded-[1.5rem] md:rounded-[3rem] border border-primary/10 p-6 md:p-10 shadow-spatial relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none select-none group-hover:opacity-[0.05] transition-opacity">
                <KeyRound className="h-24 w-24 text-primary" />
              </div>

              <div className="flex items-center gap-4 mb-6 md:mb-10">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <KeyRound className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <h2 className="text-lg md:text-xl font-black text-on-surface uppercase tracking-tight">{t.change_password}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">{t.new_password_label}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 md:h-16 bg-primary/[0.06] rounded-2xl border border-primary/20 px-4 md:px-6 font-bold text-on-surface focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-primary/30 hover:text-primary transition-colors">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">{t.confirm_password_label}</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-12 md:h-16 bg-primary/[0.06] rounded-2xl border border-primary/20 px-4 md:px-6 font-bold text-on-surface focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  />
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right: Logo & Save */}
        <div className="lg:col-span-5 space-y-6 md:space-y-8">
          <section className="bg-white rounded-[1.5rem] md:rounded-[3rem] border border-primary/10 p-6 md:p-10 shadow-spatial relative overflow-hidden group">
            <div className="space-y-6 md:space-y-8 flex flex-col items-center">
              <div className="h-36 w-36 md:h-64 md:w-64 rounded-[2rem] md:rounded-[2.5rem] bg-primary/[0.02] border-2 border-dashed border-primary/20 flex flex-col items-center justify-center relative overflow-hidden group hover:border-primary transition-all shadow-inner group/logo">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-24 w-24 md:h-48 md:w-48 object-contain p-4 group-hover/logo:scale-105 transition-transform" />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-primary/20 group-hover/logo:text-primary/40 transition-colors">
                    <ImageIcon className="h-12 w-12 md:h-20 md:w-20" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t.upload_logo}</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover/logo:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 text-white backdrop-blur-sm">
                  <Upload className="h-8 w-8" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t.upload_logo}</span>
                </div>

                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <div className="h-12 w-12 md:h-16 md:w-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 md:h-6 md:w-6 text-primary animate-pulse" />
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest animate-pulse">{t.uploading || 'Uploading...'}</span>
                  </div>
                )}
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  disabled={isUploadingLogo}
                />
              </div>
              <div className="text-center space-y-3">
                <p className="text-[11px] font-black text-on-surface uppercase tracking-[0.3em]">{t.clinic_logo}</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/[0.03] border border-primary/10 rounded-full">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">{t.recommended_logo}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="pt-4 space-y-6">
             {message && (
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className={`p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] border flex items-center gap-4 ${
                   message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-red-50 text-red-600 border-red-200'
                 }`}
               >
                 <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                   message.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'
                 }`}>
                   <CheckCircle className="h-5 w-5" />
                 </div>
                 {message.text}
               </motion.div>
             )}
             <button
                type="submit"
                disabled={isSaving}
                className="w-full h-16 md:h-24 bg-primary text-white rounded-[2rem] md:rounded-[3rem] text-xs font-black uppercase tracking-[0.5em] shadow-2xl shadow-primary/30 hover:-translate-y-2 hover:shadow-primary/40 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-6 group relative overflow-hidden"
             >
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
               {isSaving ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                 <>
                   <span>{t.save_changes}</span>
                   <ArrowRight className="h-6 w-6 group-hover:translate-x-3 transition-transform" />
                 </>
               )}
             </button>
          </div>
        </div>
      </form>

      {/* Restart Tutorial Section */}
      <section className="bg-white rounded-[2rem] md:rounded-[4rem] border border-primary/10 p-6 md:p-16 shadow-spatial relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none select-none group-hover:opacity-[0.05] transition-opacity">
          <Sparkles className="h-48 w-48 text-primary" />
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-12 relative z-10">
          <div className="h-16 w-16 md:h-24 md:w-24 rounded-[1.5rem] md:rounded-[2rem] bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-2xl shadow-primary/10 group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="h-8 w-8 md:h-12 md:w-12 text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl md:text-3xl font-black text-on-surface uppercase tracking-tight mb-4">
              {t.tutorial_title}
            </h2>
            <p className="text-sm md:text-base text-on-surface/50 font-medium mb-6 md:mb-10 leading-relaxed max-w-2xl">
              {t.tutorial_desc}
            </p>

            {tutorialResetMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mb-6 md:mb-10 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] text-[10px] font-black uppercase tracking-widest border inline-flex items-center gap-4 ${
                  tutorialResetMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-red-50 text-red-600 border-red-200'
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  tutorialResetMessage.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  <RotateCcw className="h-5 w-5" />
                </div>
                {tutorialResetMessage.text}
              </motion.div>
            )}

            <div className="flex justify-center md:justify-start">
              <button
                onClick={handleRestartTutorial}
                disabled={isRestartingTutorial}
                className="h-14 md:h-20 px-8 md:px-12 bg-primary/5 text-primary rounded-full text-xs font-black uppercase tracking-[0.4em] hover:bg-primary hover:text-white hover:shadow-2xl hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-4 md:gap-6 group"
              >
                {isRestartingTutorial ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <RotateCcw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-700" />
                    <span>{t.restart_tutorial}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
