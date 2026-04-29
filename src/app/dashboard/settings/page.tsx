'use client';

import { useEffect, useState } from 'react';
import { Building2, KeyRound, Globe, Upload, Image as ImageIcon, Loader2, CheckCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
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

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-black text-on-surface tracking-tighter uppercase mb-2">
          General <span className="text-primary italic font-serif lowercase">Settings</span>
        </h1>
        <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.4em]">
          Clinic Identity & System Preferences
        </p>
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Clinic Info */}
        <div className="lg:col-span-7 space-y-8">
          <section className="bg-white rounded-[2.5rem] border border-on-surface/5 p-8 shadow-spatial space-y-8">
            <div className="flex items-center gap-4 mb-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight">Clinic Identity</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">Contact Phone</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full h-14 bg-on-surface/[0.03] rounded-2xl border-2 border-transparent px-6 font-bold text-on-surface focus:bg-white focus:border-primary transition-all outline-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">Primary Color</label>
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
              <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">System Language</label>
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
                <h2 className="text-lg font-black text-on-surface uppercase tracking-tight">Security</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">New Password</label>
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
                  <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">Confirm Password</label>
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
                <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest">Clinic Logo</p>
                <p className="text-[9px] font-medium text-on-surface/20 mt-1 uppercase">Recommended: 512x512 PNG</p>
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
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Save Changes'}
             </button>
          </div>
        </div>
      </form>
    </div>
  );
}
