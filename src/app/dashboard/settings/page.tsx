'use client';

import { useEffect, useState } from 'react';
import { Building2, KeyRound, Globe, Upload, Image as ImageIcon, Loader2, CheckCircle, Eye, EyeOff, ArrowRight, Sparkles, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { translations, Language } from '@/lib/i18n';
import { motion } from 'framer-motion';

export default function GeneralSettingsPage() {
  const [lang, setLang] = useState<Language>('es');
  const [tenantId, setTenantId] = useState('');
  const [tenantSettings, setTenantSettings] = useState<any>({});
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  
  // Form states
  const [contactPhone, setContactPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#005c55');
  const [selectedLang, setSelectedLang] = useState<Language>('es');
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

      setIsGoogleUser(user.app_metadata.provider === 'google' || !!user.identities?.some(id => id.provider === 'google'));

      const { data } = await supabase
        .from('tenant_users')
        .select('tenant_id, tenants(*)')
        .eq('user_id', user.id)
        .single();

      if (data?.tenants) {
        const tenant = data.tenants as any;
        setTenantId(tenant.id);
        const s = tenant.settings || {};
        setTenantSettings(s);
        setLang(s.language || 'es');
        setSelectedLang(s.language || 'es');
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
      language: selectedLang
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
        setTutorialResetMessage({ text: 'Tutorial reiniciado. Recargando...', type: 'success' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setTutorialResetMessage({ text: data.error || 'Error al reiniciar', type: 'error' });
      }
    } catch (err: any) {
      setTutorialResetMessage({ text: err.message || 'Error inesperado', type: 'error' });
    } finally {
      setIsRestartingTutorial(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-black text-on-surface tracking-tighter uppercase mb-2">
          {t.general_settings?.split(' ')[0]} <span className="text-primary italic font-serif lowercase">{t.general_settings?.split(' ').slice(1).join(' ')}</span>
        </h1>
        <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.4em]">
          {t.clinic_identity_desc}
        </p>
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Clinic Info */}
        <div className="lg:col-span-7 space-y-8">
          <section className="bg-white rounded-[2.5rem] border border-on-surface/5 p-8 shadow-spatial space-y-8">
            <div className="flex items-center gap-4 mb-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight">{t.clinic_identity}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">{t.contact_phone}</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full h-14 bg-on-surface/[0.03] rounded-2xl border-2 border-transparent px-6 font-bold text-on-surface focus:bg-white focus:border-primary transition-all outline-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">{t.primary_color}</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-14 w-20 rounded-2xl border border-on-surface/10 p-1 cursor-pointer bg-white"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 h-14 bg-on-surface/[0.03] rounded-2xl border-2 border-transparent px-6 font-bold text-on-surface focus:bg-white focus:border-primary transition-all outline-none uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">{t.system_language_label}</label>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value as Language)}
                className="w-full h-14 bg-on-surface/[0.03] rounded-2xl border-2 border-transparent px-6 font-bold text-on-surface focus:bg-white focus:border-primary transition-all outline-none appearance-none"
              >
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="it">Italiano</option>
              </select>
            </div>
          </section>

          {/* Password Security */}
          {!isGoogleUser && (
            <section className="bg-white rounded-[2.5rem] border border-on-surface/5 p-8 shadow-spatial space-y-8">
              <div className="flex items-center gap-4 mb-2">
                <KeyRound className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-black text-on-surface uppercase tracking-tight">{t.change_password}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">{t.new_password_label}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-14 bg-on-surface/[0.03] rounded-2xl border-2 border-transparent px-6 font-bold text-on-surface focus:bg-white focus:border-primary transition-all outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface/20">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">{t.confirm_password_label}</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-14 bg-on-surface/[0.03] rounded-2xl border-2 border-transparent px-6 font-bold text-on-surface focus:bg-white focus:border-primary transition-all outline-none"
                  />
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right: Logo & Save */}
        <div className="lg:col-span-5 space-y-8">
          <section className="bg-white rounded-[2.5rem] border border-on-surface/5 p-8 shadow-spatial">
            <div className="space-y-8">
              <div className="h-48 w-full rounded-3xl bg-on-surface/[0.02] border-2 border-dashed border-on-surface/10 flex flex-col items-center justify-center relative overflow-hidden group hover:border-primary transition-colors">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-32 w-32 object-contain" />
                ) : (
                  <ImageIcon className="h-12 w-12 text-on-surface/10" />
                )}
                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isUploadingLogo}
                />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest">{t.clinic_logo}</p>
                <p className="text-[9px] font-medium text-on-surface/20 mt-1 uppercase">{t.recommended_logo}</p>
              </div>
            </div>
          </section>

          <div className="pt-4">
             {message && (
               <div className={`mb-6 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                 message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
               }`}>
                 {message.text}
               </div>
             )}
             <button
                type="submit"
                disabled={isSaving}
                className="w-full h-16 bg-primary text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
             >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : t.save_changes}
             </button>
          </div>
        </div>
      </form>

      {/* Restart Tutorial Section */}
      <section className="bg-white rounded-[2.5rem] border border-on-surface/5 p-8 shadow-spatial">
        <div className="flex items-start gap-6">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-on-surface uppercase tracking-tight mb-2">
              Interactive Tutorial
            </h2>
            <p className="text-sm text-on-surface/50 font-medium mb-6 leading-relaxed">
              Restart the guided walkthrough of your dashboard. This will show you the main features again step by step.
            </p>
            
            {tutorialResetMessage && (
              <div className={`mb-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                tutorialResetMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
              }`}>
                {tutorialResetMessage.text}
              </div>
            )}
            
            <button
              onClick={handleRestartTutorial}
              disabled={isRestartingTutorial}
              className="h-14 px-8 bg-primary/10 text-primary rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
            >
              {isRestartingTutorial ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  <span>{t.restart_tutorial || 'Restart Tutorial'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
