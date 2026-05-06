'use client';

import { useState } from 'react';
import Link from 'next/link';
import { registerAction } from './actions';
import { ShieldCheck, ArrowLeft, Mail, Lock, Building, AlertCircle, Loader2, ChevronRight, Globe, Sparkles } from 'lucide-react';
import { useLandingTranslation } from '@/components/LanguageContext';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { MicrosoftAuthButton } from '@/components/auth/MicrosoftAuthButton';
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
      <div className="min-h-screen w-full flex items-center justify-center bg-white p-6 overflow-hidden relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full border border-primary/10 p-16 md:p-20 text-center relative"
        >
          <div className="h-24 w-24 bg-primary/[0.08] flex items-center justify-center mx-auto mb-10 border border-primary/20">
            <Mail className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-[#191c1e] tracking-tighter uppercase mb-4">
            Account <br />
            <span className="text-primary italic">Created</span>
          </h2>
          <p className="text-sm font-medium text-[#191c1e]/50 mb-10 leading-relaxed">
            Your clinical workspace has been initialized successfully. <br />
            Please authorize your session to continue.
          </p>
          <Link href="/login" className="w-full inline-flex items-center justify-center gap-3 py-5 bg-primary text-white text-xs font-black uppercase tracking-[0.4em] hover:bg-primary-light hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20">
            Proceed to Secure Login <ChevronRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white p-6 overflow-hidden relative">

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/[0.03] blur-[120px] rounded-full -z-10 pointer-events-none" />

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

        <div className="border border-primary/10 p-12 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none select-none">
            <span className="text-6xl font-black uppercase tracking-tighter text-primary">Join</span>
          </div>

          <header className="mb-12 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/10 bg-primary/[0.03] text-primary text-[9px] font-black uppercase tracking-[0.2em] mb-6">
              <Sparkles className="h-3 w-3" /> Start 14-Day Trial
            </div>
            <h1 className="text-4xl font-black text-[#191c1e] tracking-tighter uppercase mb-3">
              Operational <br />
              <span className="text-primary italic">Registry</span>
            </h1>
            <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em]">
              Precision Onboarding
            </p>
          </header>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-red-50 border border-red-200 flex items-center gap-4"
            >
              <div className="h-10 w-10 bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-red-800 tracking-tight uppercase">
                {error}
              </p>
            </motion.div>
          )}

          <div className="space-y-5 relative z-10">
            <div className="grid grid-cols-2 gap-3">
              <GoogleAuthButton actionText="Google" />
              <MicrosoftAuthButton actionText="Microsoft" />
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-primary/10" />
              <span className="text-[8px] font-black text-primary/30 uppercase tracking-[0.4em]">or email</span>
              <div className="h-px flex-1 bg-primary/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">
                  Clinical Center Name
                </label>
                <div className="relative group">
                  <Building className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                  <input
                    name="clinicName"
                    required
                    className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-14 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                    placeholder="e.g. London Medical Group"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">
                  Professional Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-14 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                    placeholder="doctor@provider.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">
                  Regional Localization
                </label>
                <div className="relative group">
                  <Globe className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                  <select
                    name="language"
                    required
                    className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-14 pr-10 text-sm font-bold text-[#191c1e] focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none"
                    defaultValue="es"
                  >
                    <option value="es">Español (ES)</option>
                    <option value="en">English (US)</option>
                    <option value="it">Italiano (IT)</option>
                  </select>
                  <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 pointer-events-none rotate-90" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">
                  Access Key
                </label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-14 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white text-xs font-black uppercase tracking-[0.4em] transition-all shadow-xl shadow-primary/20 hover:bg-primary-light hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group mt-6"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>Initialize Account</span>
                    <ShieldCheck className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-10 pt-8 border-t border-primary/10 flex flex-col items-center gap-4 text-center relative z-10">
            <p className="text-xs font-medium text-[#191c1e]/50">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-black uppercase tracking-widest text-[10px] ml-2 hover:text-primary-light transition-colors">
                Log In
              </Link>
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center justify-center gap-3 text-[10px] font-black text-primary/50 uppercase tracking-[0.4em] mt-10 hover:text-primary transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-2" />
          Back to Portal
        </Link>
      </motion.div>
    </div>
  );
}
