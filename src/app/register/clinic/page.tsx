'use client';

import { useState, useRef } from 'react';
import { createClinicAction } from './actions';
import { Building, ShieldCheck, Loader2, ArrowRight, Phone, Globe } from 'lucide-react';
import { Language, translations } from '@/lib/i18n';

export default function RegisterClinicPage() {
  const [step, setStep] = useState(0);
  const [selectedLang, setSelectedLang] = useState<Language>('es');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const t = translations[selectedLang] || translations['es'];

  async function handleLanguageSelect(lang: Language) {
    setSelectedLang(lang);
    setStep(1);
  }

  async function handleSubmit(e?: React.FormEvent<HTMLFormElement>) {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = formRef.current ? new FormData(formRef.current) : new FormData();
      
      // Ensure language is set in formData
      formData.set('language', selectedLang);

      // If no clinic name (skipped), use a default
      if (!formData.get('clinicName')) {
        formData.set('clinicName', selectedLang === 'es' ? 'Mi Clínica' : selectedLang === 'it' ? 'La Mia Clinica' : 'My Clinic');
      }

      const res = await createClinicAction(formData);
      
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error(err);
      setError(selectedLang === 'es' ? 'Ocurrió un error inesperado.' : 'An unexpected error occurred.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white p-6 overflow-hidden relative">
      {/* Decoración de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/[0.03] blur-[120px] rounded-full -z-10 pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white border border-primary/10 p-12 md:p-16 relative overflow-hidden shadow-spatial">
          {/* Texto decorativo de fondo */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none select-none">
            <span className="text-6xl font-black uppercase tracking-tighter text-primary">
              {step === 0 ? 'Lang' : 'Clinic'}
            </span>
          </div>

          {step === 0 && (
            <div className="animate-in fade-in duration-700 relative z-10">
              <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/10 bg-primary/[0.03] text-primary text-[9px] font-black uppercase tracking-[0.2em] mb-6">
                  <Globe className="h-3 w-3" /> Next-Generation Onboarding
                </div>
                <h1 className="text-3xl font-black text-[#191c1e] tracking-tighter uppercase mb-3">
                  Select <br />
                  <span className="text-primary italic">Language</span>
                </h1>
                <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em]">
                  Universal Identity Access
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  { id: 'es', name: 'Español', code: 'ES' },
                  { id: 'en', name: 'English', code: 'US' },
                  { id: 'it', name: 'Italiano', code: 'IT' },
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleLanguageSelect(l.id as Language)}
                    className="flex items-center justify-between p-5 bg-primary/[0.03] border border-primary/10 hover:border-primary hover:bg-primary/[0.08] transition-all group relative overflow-hidden"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-primary/30 group-hover:text-primary transition-colors">{l.code}</span>
                      <span className="font-black text-[#191c1e] uppercase tracking-[0.2em] text-xs">
                        {l.name}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary/30 group-hover:text-primary group-hover:translate-x-2 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-in slide-in-from-right-8 duration-700 relative z-10">
              <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/10 bg-primary/[0.03] text-primary text-[9px] font-black uppercase tracking-[0.2em] mb-6">
                  <ShieldCheck className="h-3 w-3" /> Precision Registration
                </div>
                <h1 className="text-3xl font-black text-[#191c1e] tracking-tighter uppercase mb-3">
                  Almost <br />
                  <span className="text-primary italic">Ready</span>
                </h1>
                <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em]">
                  Establish Clinical Identity
                </p>
              </div>

              {error && (
                <div className="mb-8 p-6 bg-red-50 border border-red-200 flex items-center gap-4">
                  <p className="text-xs font-bold text-red-800 tracking-tight uppercase">
                    {error}
                  </p>
                </div>
              )}

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2 mb-2 block">
                    {t.registration.name_label}
                  </label>
                  <div className="relative group">
                    <Building className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                    <input
                      name="clinicName"
                      required
                      autoFocus
                      className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-14 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                      placeholder={t.registration.name_ph}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2 mb-2 block">
                    {t.registration.phone_label}
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                    <input
                      name="contactPhone"
                      className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-14 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                      placeholder={t.registration.phone_ph}
                    />
                  </div>
                </div>

                <div className="pt-6 space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-primary text-white text-xs font-black uppercase tracking-[0.4em] transition-all shadow-xl shadow-primary/20 hover:bg-primary-light hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>{t.registration.finish_btn}</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    className="w-full py-2 text-[9px] font-black text-primary/60 uppercase tracking-widest hover:text-primary transition-colors"
                  >
                    {t.registration.skip_btn}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
