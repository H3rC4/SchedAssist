'use client';

import { useState, useRef } from 'react';
import { createClinicAction } from './actions';
import { Building, ShieldCheck, Loader2, ArrowRight, Phone } from 'lucide-react';

export default function RegisterClinicPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e?: React.FormEvent<HTMLFormElement>) {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = formRef.current ? new FormData(formRef.current) : new FormData();
      
      // If no clinic name (skipped), use a default
      if (!formData.get('clinicName')) {
        formData.set('clinicName', 'Mi Clínica');
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
      setError('Ocurrió un error inesperado.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px] dark:bg-emerald-500/10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] dark:bg-indigo-500/10" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-8 md:p-12 border border-slate-200/50 dark:border-slate-800/50">
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase">
              ¡Casi listo!
            </h1>
            <p className="text-sm font-semibold text-slate-500 mt-2">
              Configura los datos básicos de tu clínica para comenzar.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100">
              {error}
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase ml-1">
                Nombre de tu Clínica
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  name="clinicName"
                  required
                  className="block w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-900 dark:text-white"
                  placeholder="Ej: Odontosmile"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase ml-1">
                Teléfono de Contacto (Público)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  name="contactPhone"
                  className="block w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-900 dark:text-white"
                  placeholder="+34 600 000 000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase ml-1">
                Idioma del Sistema
              </label>
              <select
                name="language"
                required
                className="block w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="es">🇪🇸 Español</option>
                <option value="en">🇺🇸 English</option>
                <option value="it">🇮🇹 Italiano</option>
              </select>
            </div>

            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-[2rem] bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-400 text-white dark:text-slate-900 font-black uppercase tracking-widest transition-all shadow-xl hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Crear Mi Clínica <ArrowRight className="h-5 w-5" /></>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSubmit()}
                className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                Completar más tarde
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
