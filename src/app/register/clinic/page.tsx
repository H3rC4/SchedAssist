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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-all duration-1000 ${
        selectedLang === 'es' ? 'bg-amber-500/10' : selectedLang === 'it' ? 'bg-emerald-500/10' : 'bg-indigo-500/10'
      }`} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-500/5 blur-[120px]" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-8 md:p-12 border border-slate-200/50 dark:border-white/5 animate-in zoom-in-95 duration-500">
          
          {step === 0 && (
            <div className="animate-in fade-in duration-500">
              <div className="text-center mb-10">
                <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Globe className="h-8 w-8 text-amber-500" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {translations['en'].onboarding.select_language}
                </h1>
                <p className="text-sm font-semibold text-slate-500 mt-2">
                  Welcome to SchedAssist. Let's start by choosing your language.
                </p>
              </div>

              <div className="grid gap-4">
                {[
                  { id: 'es', name: 'Español', flag: '🇪🇸' },
                  { id: 'en', name: 'English', flag: '🇺🇸' },
                  { id: 'it', name: 'Italiano', flag: '🇮🇹' },
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleLanguageSelect(l.id as Language)}
                    className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 hover:border-amber-500 hover:scale-[1.02] active:scale-95 transition-all group shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{l.flag}</span>
                      <span className="font-black text-slate-700 dark:text-white uppercase tracking-widest text-sm">
                        {l.name}
                      </span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-amber-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-in slide-in-from-right-8 duration-500">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {t.registration.title}
                </h1>
                <p className="text-sm font-semibold text-slate-500 mt-2 leading-relaxed">
                  {t.registration.subtitle}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-5 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold border border-red-100 dark:border-red-500/20 italic">
                  ⚠ {error}
                </div>
              )}

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-[0.2em] ml-2">
                    {t.registration.name_label}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
                    </div>
                    <input
                      name="clinicName"
                      required
                      autoFocus
                      className="block w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 dark:bg-black border-none ring-1 ring-slate-200 dark:ring-white/10 focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-900 dark:text-white shadow-inner"
                      placeholder={t.registration.name_ph}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-[0.2em] ml-2">
                    {t.registration.phone_label}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
                    </div>
                    <input
                      name="contactPhone"
                      className="block w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 dark:bg-black border-none ring-1 ring-slate-200 dark:ring-white/10 focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-900 dark:text-white shadow-inner"
                      placeholder={t.registration.phone_ph}
                    />
                  </div>
                </div>

                <div className="space-y-5 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 rounded-[2rem] bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-900 font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-amber-500/10 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>{t.registration.finish_btn} <ArrowRight className="h-5 w-5" /></>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    className="w-full py-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-amber-500 transition-colors"
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
