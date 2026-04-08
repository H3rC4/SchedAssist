'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn } from './actions';
import { ShieldCheck, ArrowLeft, Mail, Lock, AlertCircle, CalendarCheck } from 'lucide-react';
import { useLandingTranslation } from '@/components/LanguageContext';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';


export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; confirmed?: string };
}) {
  const { t, language } = useLandingTranslation();
  const error = searchParams?.error;
  const confirmed = searchParams?.confirmed === 'true';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">
      {/* Abstract Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] dark:bg-indigo-500/10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] dark:bg-amber-500/10" />

      <div className="max-w-md w-full relative z-10">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>{t.back_home}</span>
        </Link>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl shadow-indigo-900/10 dark:shadow-black/50 border border-slate-200/50 dark:border-slate-800/50 p-8 md:p-12">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="h-16 w-16 bg-slate-900 dark:bg-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-900/10 mb-6">
              <CalendarCheck className="h-8 w-8 text-amber-400 dark:text-slate-900" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase mb-2">
              Sched<span className="text-amber-500">Assist</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
              {t.login_card_title}
            </p>
          </div>

          {confirmed && (
            <div className="mb-8 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 p-5 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  ¡Email verificado con éxito! Ya puedes iniciar sesión.
                </p>
              </div>
            </div>
          )}

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

          <form action={signIn} method="POST" className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1 uppercase tracking-wider"
              >

                {t.email_label}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-amber-500 transition-all font-medium text-slate-900 dark:text-white"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  {t.password_label}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-indigo-600 dark:text-amber-400 hover:underline"
                >
                  {t.forgot_password}
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-amber-500 transition-all font-medium text-slate-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-5 w-5 rounded-lg border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-amber-500 focus:ring-indigo-500 dark:focus:ring-amber-500"
              />
              <label
                htmlFor="remember-me"
                className="text-sm font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                {t.remember_me}
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-5 rounded-[2rem] bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-900 text-base font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/10 dark:shadow-black/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 mt-4"
            >
              {t.login_button} <ShieldCheck className="h-5 w-5" />
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t.no_client_yet}{' '}
              <span className="text-indigo-600 dark:text-amber-500 font-bold">
                {t.contact_sales}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
