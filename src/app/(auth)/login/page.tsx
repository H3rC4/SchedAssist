'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn } from './actions';
import { ShieldCheck, ArrowLeft, Mail, Lock, AlertCircle, CalendarCheck, Loader2, ChevronRight, Sparkles } from 'lucide-react';
import { useLandingTranslation } from '@/components/LanguageContext';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { MicrosoftAuthButton } from '@/components/auth/MicrosoftAuthButton';
import { Logo } from '@/components/Logo';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; confirmed?: string };
}) {
  const { t, language } = useLandingTranslation();
  const error = searchParams?.error;
  const confirmed = searchParams?.confirmed === 'true';
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await signIn(formData);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-primary-950 p-6 overflow-hidden relative">
      <div className="fixed inset-0 grid-bg opacity-5 pointer-events-none -z-20" />
      <div className="fixed inset-0 noise opacity-10 pointer-events-none -z-20" />
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary-light/10 blur-[120px] rounded-full -z-10 pointer-events-none" />

      <AnimatePresence>
        {isSubmitting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-primary-950/90 backdrop-blur-2xl"
          >
            <div className="relative">
              <div className="h-32 w-32 rounded-[2.5rem] border-[6px] border-primary-light/10 border-t-primary-light animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CalendarCheck className="h-10 w-10 text-primary-light animate-pulse" />
              </div>
            </div>
            <p className="mt-12 text-xs font-black text-white uppercase tracking-[0.5em] animate-pulse">
              Authenticating
            </p>
            <p className="mt-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Securing session...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-xl w-full relative z-10"
      >
        <div className="flex justify-center mb-12">
          <Link href="/" className="hover:scale-105 transition-transform active:scale-95">
            <Logo textColor="text-white" />
          </Link>
        </div>

        <div className="bg-primary-950/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 p-12 md:p-16 relative overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
            <div className="absolute inset-0 noise opacity-[0.04]" />
          </div>

          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none select-none">
            <span className="text-6xl font-black uppercase tracking-tighter text-white">Login</span>
          </div>

          <header className="mb-12 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/5 bg-white/5 backdrop-blur-xl text-primary-light text-[9px] font-black uppercase tracking-[0.2em] mb-6">
              <Sparkles className="h-3 w-3" /> Next-Generation Access
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-3">
              Welcome <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-primary-400 italic">Back</span>
            </h1>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">
              Precision Identity Access
            </p>
          </header>

          {confirmed && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 rounded-[1.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-emerald-300 tracking-tight">
                Account verified. Access granted.
              </p>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 rounded-[1.5rem] bg-red-500/10 border border-red-500/20 flex items-center gap-4"
            >
              <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-red-300 tracking-tight uppercase">
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
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">or email</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <form action={handleSubmit} method="POST" className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em] ml-2">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary-light transition-colors" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-4 pl-14 pr-5 text-sm font-bold text-white placeholder:text-white/20 focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light/50 transition-all outline-none"
                    placeholder="name@provider.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <label htmlFor="password" className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">
                    Secret Key
                  </label>
                  <Link href="/forgot-password" className="text-[9px] font-black text-primary-light uppercase tracking-widest hover:text-primary-200 transition-all">
                    Recovery
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary-light transition-colors" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-4 pl-14 pr-5 text-sm font-bold text-white placeholder:text-white/20 focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light/50 transition-all outline-none"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <SubmitButton />
              </div>
            </form>
          </div>

          <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-4 text-center relative z-10">
            <p className="text-xs font-medium text-white/40">
              New to SchedAssist?{' '}
              <Link href="/register" className="text-accent-500 font-black uppercase tracking-widest text-[10px] ml-2 hover:text-accent-400 transition-colors">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center justify-center gap-3 text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-10 hover:text-primary-light transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-2" />
          Back to Portal
        </Link>
      </motion.div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = (require('react-dom') as any).useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-4 rounded-[1.5rem] bg-gradient-to-r from-primary-light to-primary text-white text-xs font-black uppercase tracking-[0.4em] transition-all shadow-xl shadow-primary-light/20 hover:shadow-primary-light/40 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group"
    >
      <span>Synchronize Access</span>
      <ChevronRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
    </button>
  );
}
