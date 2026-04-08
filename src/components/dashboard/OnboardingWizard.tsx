'use client';

import { useState } from 'react';
import { Loader2, ArrowRight, UserPlus, Sparkles, CheckCircle2 } from 'lucide-react';
import { translations, Language } from '@/lib/i18n';

interface OnboardingWizardProps {
  tenantId: string;
  lang: Language;
  onComplete: () => void;
}

export function OnboardingWizard({ tenantId, lang, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formularios
  const [profName, setProfName] = useState('');
  const [profSpecialty, setProfSpecialty] = useState('');
  
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState('30');
  const [servicePrice, setServicePrice] = useState('0');

  // Traducción base o fallo a inglés
  const t = translations[lang] || translations['en'];

  async function handleProfessionalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          full_name: profName,
          specialty: profSpecialty
        })
      });
      if (res.ok) {
        const profData = await res.json();
        
        // --- Generar Horarios por Defecto (Lunes a Viernes, 9 a 18) ---
        const defaultRules = [];
        for (let i = 0; i < 7; i++) {
          defaultRules.push({
            day_of_week: i,
            start_time: '09:00:00',
            end_time: '18:00:00',
            active: i >= 1 && i <= 5 // 1=Lunes ... 5=Viernes
          });
        }
        await fetch('/api/professionals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            professional_id: profData.id,
            tenant_id: tenantId,
            rules: defaultRules
          })
        });
        
        setStep(2);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Error al crear profesional.');
      }
    } catch {
      setError('Problema de red.');
    } finally {
      setLoading(false);
    }
  }

  async function handleServiceSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          name: serviceName,
          duration_minutes: serviceDuration,
          price: parseFloat(servicePrice) || 0,
          active: true
        })
      });
      if (res.ok) {
        setStep(3);
      } else {
        setError('Error al crear servicio.');
      }
    } catch {
      setError('Problema de red.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFinish() {
    setLoading(true);
    try {
      const res = await fetch('/api/tenant/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId })
      });
      if (res.ok) {
        onComplete();
      }
    } catch (e) {
      console.error(e);
      onComplete(); // Forzar cierre aunque falle para no bloquear al usuario
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 relative animate-in zoom-in-95 duration-500">
        
        {/* Magic Background */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-[80px]" />

        <div className="relative z-10 p-10">
          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mb-10">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-2 rounded-full transition-all duration-500 ${
                  s === step ? 'w-10 bg-amber-500' : 
                  s < step ? 'w-4 bg-emerald-500' : 'w-4 bg-slate-200 dark:bg-slate-800'
                }`} 
              />
            ))}
          </div>

          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <UserPlus className="h-8 w-8 text-amber-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-2">
                Tu Equipo
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8 font-medium">
                Crea al primer profesional que atenderá citas en tu clínica.
              </p>

              <form onSubmit={handleProfessionalSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mb-2">
                    {t.fullName}
                  </label>
                  <input
                    required
                    autoFocus
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    placeholder={t.fullNamePH || 'Dra. María Antonieta'}
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mb-2">
                    {t.specialty}
                  </label>
                  <input
                    required
                    value={profSpecialty}
                    onChange={(e) => setProfSpecialty(e.target.value)}
                    placeholder={t.specialtyPH || 'Cardiología'}
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-all"
                  />
                </div>
                {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}
                
                <button
                  type="submit"
                  disabled={loading || !profName || !profSpecialty}
                  className="w-full h-14 mt-4 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 !mt-8 shadow-xl"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Siguiente <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <div className="h-16 w-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-2">
                Tus Servicios
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8 font-medium">
                ¿Qué servicios ofreces a tus pacientes?
              </p>

              <form onSubmit={handleServiceSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mb-2">
                    Nombre del Servicio
                  </label>
                  <input
                    required
                    autoFocus
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="Consulta General"
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-2">
                      Duración (Minutos)
                    </label>
                    <input
                      required
                      type="number"
                      value={serviceDuration}
                      onChange={(e) => setServiceDuration(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-2">
                      Precio (Monto)
                    </label>
                    <input
                      required
                      type="number"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}
                
                <button
                  type="submit"
                  disabled={loading || !serviceName}
                  className="w-full h-14 mt-4 bg-slate-900 dark:bg-indigo-500 hover:bg-slate-800 dark:hover:bg-indigo-400 text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 !mt-8 shadow-xl"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Siguiente <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in slide-in-from-bottom-8 duration-700 text-center py-6">
              <div className="h-24 w-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                ¡Todo Listo!
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-10 max-w-[250px] mx-auto leading-relaxed">
                Tu clínica está configurada. Ahora puedes gestionar citas, invitar más doctores o ajustar tus horarios.
              </p>
              
              <button
                onClick={handleFinish}
                disabled={loading}
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-xl shadow-emerald-500/20"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Entrar al Dashboard'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
