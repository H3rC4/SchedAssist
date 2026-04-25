'use client';

import { useState } from 'react';
import Link from 'next/link';
import { registerAction } from './actions';
import { ShieldCheck, ArrowLeft, Mail, Lock, Building, AlertCircle, CalendarCheck, Loader2 } from 'lucide-react';
import { useLandingTranslation } from '@/components/LanguageContext';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';


export default function RegisterPage() {
  const { t } = useLandingTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await registerAction(formData);

      if (result?.success) {
        setIsSuccess(true);
        setLoading(false);
      } else if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Ocurrió un error inesperado. Por favor intenta de nuevo.');
      setLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden text-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-12 border border-slate-200/50 dark:border-slate-800/50 z-10">
          <div className="h-20 w-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
            <Mail className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase mb-4 tracking-tight">
            ¡Cuenta Creada!
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium">
            Tu cuenta ha sido creada exitosamente. <br /><br />
            <strong className="text-slate-900 dark:text-white">Inicia sesión con tu correo y contraseña para configurar tu clínica.</strong>
          </p>
          <Link href="/login" className="w-full inline-flex justify-center items-center py-4 rounded-2xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900 font-bold uppercase hover:bg-slate-800 dark:hover:bg-amber-400 transition-colors shadow-xl">
            Ir a Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] dark:bg-indigo-500/10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] dark:bg-amber-500/10" />

      <div className="max-w-md w-full relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>{t.back_home}</span>
        </Link>

        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl shadow-indigo-900/10 dark:shadow-black/50 border border-slate-200/50 dark:border-slate-800/50 p-8 md:p-12">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="h-16 w-16 bg-slate-900 dark:bg-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-900/10 mb-6">
              <CalendarCheck className="h-8 w-8 text-amber-400 dark:text-slate-900" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase mb-2">
              Sched<span className="text-amber-500">Assist</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
              Comenzar prueba gratuita
            </p>
          </div>

          {error && (
            <div className="mb-8 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-5 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          )}

          <div className="mb-8">
            <GoogleAuthButton actionText="Continuar con Google" />
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">O con tu correo</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1 uppercase tracking-wider">
                Nombre de la Clínica
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                </div>
                <input
                  name="clinicName"
                  required
                  className="block w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-amber-500 transition-all font-medium text-slate-900 dark:text-white"
                  placeholder="Ej: Centro Gastroenterológico"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1 uppercase tracking-wider">
                Email Profesional
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-amber-500 transition-all font-medium text-slate-900 dark:text-white"
                  placeholder="doctor@clinica.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1 uppercase tracking-wider">
                Idioma Preferido
              </label>
              <div className="relative group">
                <select
                  name="language"
                  required
                  className="block w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-amber-500 transition-all font-medium text-slate-900 dark:text-white"
                  defaultValue="es"
                >
                  <option value="es">Español</option>
                  <option value="en">English (US)</option>
                  <option value="it">Italiano</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="block w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-amber-500 transition-all font-medium text-slate-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 rounded-[2rem] bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-900 text-base font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/10 dark:shadow-black/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 mt-4"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>Crear mi cuenta <ShieldCheck className="h-5 w-5" /></>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="text-indigo-600 dark:text-amber-500 font-bold hover:underline">
                Inicia Sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
