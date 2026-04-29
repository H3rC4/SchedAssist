'use client';

import { useState } from 'react';
import Link from 'next/link';
import { registerAction } from './actions';
import { ShieldCheck, ArrowLeft, Mail, Lock, Building, AlertCircle, CalendarCheck, Loader2, ChevronRight, Globe } from 'lucide-react';
import { useLandingTranslation } from '@/components/LanguageContext';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/Logo';

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
      <div className="min-h-screen w-full flex items-center justify-center bg-surface p-6 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-white rounded-[4rem] shadow-spatial p-16 md:p-24 border border-on-surface/5 text-center relative"
        >
          <div className="h-32 w-32 bg-emerald-50 rounded-[3rem] flex items-center justify-center mx-auto mb-12 shadow-lg shadow-emerald-500/10">
            <Mail className="h-12 w-12 text-emerald-600 animate-pulse" />
          </div>
          <h2 className="text-4xl font-black text-on-surface tracking-tighter uppercase mb-6">
            Account <br />
            <span className="text-emerald-500 italic font-serif lowercase">Verified</span>
          </h2>
          <p className="text-sm font-medium text-on-surface/40 mb-12 leading-relaxed">
            Your clinical workspace has been initialized successfully. <br />
            Please authorize your session to continue.
          </p>
          <Link href="/login" className="w-full flex items-center justify-center gap-4 py-6 rounded-[2rem] bg-on-surface text-white text-xs font-black uppercase tracking-[0.4em] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/10">
            Proceed to Secure Login <ChevronRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface p-6 overflow-hidden relative">
      {/* Editorial Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-primary/10" />
      <div className="absolute bottom-20 right-20 opacity-5 pointer-events-none">
        <Building className="h-64 w-64 text-primary" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-xl w-full relative z-10"
      >
        <div className="flex justify-center mb-12">
          <Link href="/" className="hover:scale-105 transition-transform active:scale-95">
            <Logo />
          </Link>
        </div>

        <div className="bg-white rounded-[4rem] shadow-spatial border border-on-surface/5 p-12 md:p-20 relative overflow-hidden">
          {/* Subtle Background Text */}
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none select-none">
            <span className="text-9xl font-black uppercase tracking-tighter">Join</span>
          </div>

          <header className="mb-16 relative z-10 text-center">
            <h1 className="text-4xl font-black text-on-surface tracking-tighter uppercase mb-4">
              Operational <br />
              <span className="text-primary italic font-serif lowercase">Registry</span>
            </h1>
            <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.4em]">
              Start 14-Day Precision Trial
            </p>
          </header>

          {error && (
            <div className="mb-12 p-8 rounded-[2rem] bg-red-50 border border-red-100 flex items-center gap-6 animate-in fade-in slide-in-from-top-4">
              <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="text-sm font-black text-red-900 tracking-tight uppercase">
                {error}
              </p>
            </div>
          )}

          <div className="space-y-12 relative z-10">
            <GoogleAuthButton actionText="Register via Google Workspace" />

            <div className="flex items-center gap-6">
              <div className="h-px flex-1 bg-on-surface/5" />
              <span className="text-[8px] font-black text-on-surface/20 uppercase tracking-[0.4em]">Internal Identity</span>
              <div className="h-px flex-1 bg-on-surface/5" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.3em] ml-2">
                  Clinical Center Name
                </label>
                <div className="relative group">
                  <Building className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface/20 group-focus-within:text-primary transition-colors" />
                  <input
                    name="clinicName"
                    required
                    className="w-full bg-surface-container-lowest border border-on-surface/5 rounded-[1.5rem] py-5 pl-16 pr-6 text-sm font-bold text-on-surface placeholder:text-on-surface/20 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                    placeholder="e.g. London Medical Group"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.3em] ml-2">
                  Professional Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface/20 group-focus-within:text-primary transition-colors" />
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full bg-surface-container-lowest border border-on-surface/5 rounded-[1.5rem] py-5 pl-16 pr-6 text-sm font-bold text-on-surface placeholder:text-on-surface/20 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                    placeholder="doctor@provider.com"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.3em] ml-2">
                  Regional Localization
                </label>
                <div className="relative group">
                  <Globe className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface/20 group-focus-within:text-primary transition-colors" />
                  <select
                    name="language"
                    required
                    className="w-full bg-surface-container-lowest border border-on-surface/5 rounded-[1.5rem] py-5 pl-16 pr-10 text-sm font-bold text-on-surface focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none appearance-none"
                    defaultValue="es"
                  >
                    <option value="es">Español (ES)</option>
                    <option value="en">English (US)</option>
                    <option value="it">Italiano (IT)</option>
                  </select>
                  <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface/20 pointer-events-none rotate-90" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.3em] ml-2">
                  Access Key
                </label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface/20 group-focus-within:text-primary transition-colors" />
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="w-full bg-surface-container-lowest border border-on-surface/5 rounded-[1.5rem] py-5 pl-16 pr-6 text-sm font-bold text-on-surface placeholder:text-on-surface/20 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-6 rounded-[2rem] bg-on-surface text-white hover:bg-primary transition-all shadow-xl hover:shadow-primary/20 active:scale-95 flex items-center justify-center gap-4 group mt-8"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span className="text-xs font-black uppercase tracking-[0.4em]">Initialize Account</span>
                    <ShieldCheck className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-16 pt-12 border-t border-on-surface/5 flex flex-col items-center gap-6 text-center">
            <p className="text-xs font-medium text-on-surface/40">
              Already have an account? <Link href="/login" className="text-primary font-black uppercase tracking-widest text-[10px] ml-2 hover:underline">Log In</Link>
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center justify-center gap-4 text-[10px] font-black text-on-surface/40 uppercase tracking-[0.4em] mt-12 hover:text-primary transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-2" />
          Back to Portal
        </Link>
      </motion.div>
    </div>
  );
}
