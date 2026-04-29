'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn } from './actions';
import { ShieldCheck, ArrowLeft, Mail, Lock, AlertCircle, CalendarCheck, Loader2, ChevronRight } from 'lucide-react';
import { useLandingTranslation } from '@/components/LanguageContext';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
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
    <div className="min-h-screen w-full flex items-center justify-center bg-surface p-6 overflow-hidden relative">
      {/* Editorial Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-primary/10" />
      <div className="absolute top-20 left-20 opacity-5 pointer-events-none">
        <ShieldCheck className="h-64 w-64 text-primary" />
      </div>

      <AnimatePresence>
        {isSubmitting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-2xl"
          >
            <div className="relative">
              <div className="h-32 w-32 rounded-[2.5rem] border-[6px] border-primary/10 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CalendarCheck className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>
            <p className="mt-12 text-xs font-black text-on-surface uppercase tracking-[0.5em] animate-pulse">
              Authenticating
            </p>
            <p className="mt-4 text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">
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
            <Logo />
          </Link>
        </div>

        <div className="bg-white rounded-[4rem] shadow-spatial border border-on-surface/5 p-12 md:p-20 relative overflow-hidden">
          {/* Subtle Background Text */}
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none select-none">
            <span className="text-7xl font-black uppercase tracking-tighter">Login</span>
          </div>

          <header className="mb-16 relative z-10 text-center">
            <h1 className="text-4xl font-black text-on-surface tracking-tighter uppercase mb-4">
              Welcome <br />
              <span className="text-primary italic font-serif lowercase">Back</span>
            </h1>
            <p className="text-[10px] font-black text-on-surface/60 uppercase tracking-[0.4em]">
              Precision Identity Access
            </p>
          </header>

          {confirmed && (
            <div className="mb-12 p-8 rounded-[2rem] bg-emerald-50 border border-emerald-100 flex items-center gap-6 animate-in fade-in slide-in-from-top-4">
              <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="text-sm font-black text-emerald-900 tracking-tight">
                Account verified. Access granted.
              </p>
            </div>
          )}

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
            <div className="group">
              <GoogleAuthButton actionText="Continue with Google Identity" />
            </div>

            <div className="flex items-center gap-6">
              <div className="h-px flex-1 bg-on-surface/5" />
              <span className="text-[8px] font-black text-on-surface/20 uppercase tracking-[0.4em]">Operational Login</span>
              <div className="h-px flex-1 bg-on-surface/5" />
            </div>

            <form action={handleSubmit} method="POST" className="space-y-10">
              <div className="space-y-4">
                <label htmlFor="email" className="text-[10px] font-black text-on-surface/70 uppercase tracking-[0.3em] ml-2">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface/20 group-focus-within:text-primary transition-colors" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full bg-surface-container-lowest border border-on-surface/5 rounded-[1.5rem] py-5 pl-16 pr-6 text-sm font-bold text-on-surface placeholder:text-on-surface/20 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                    placeholder="name@provider.com"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label htmlFor="password" className="text-[10px] font-black text-on-surface/70 uppercase tracking-[0.3em]">
                    Secret Key
                  </label>
                  <Link href="/forgot-password" className="text-[10px] font-black text-primary uppercase tracking-widest hover:tracking-[0.2em] transition-all">
                    Recovery
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface/20 group-focus-within:text-primary transition-colors" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="w-full bg-surface-container-lowest border border-on-surface/5 rounded-[1.5rem] py-5 pl-16 pr-6 text-sm font-bold text-on-surface placeholder:text-on-surface/20 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="pt-4">
                <SubmitButton />
              </div>
            </form>
          </div>

          <div className="mt-16 pt-12 border-t border-on-surface/5 flex flex-col items-center gap-6 text-center">
            <p className="text-xs font-medium text-on-surface/40">
              New to SchedAssist? <Link href="/register" className="text-primary font-black uppercase tracking-widest text-[10px] ml-2 hover:underline">Create Account</Link>
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center justify-center gap-4 text-[10px] font-black text-on-surface/70 uppercase tracking-[0.4em] mt-12 hover:text-primary transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-2" />
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
      className="w-full py-6 rounded-[2rem] bg-on-surface text-white hover:bg-primary transition-all shadow-xl hover:shadow-primary/20 active:scale-95 flex items-center justify-center gap-4 group"
    >
      <span className="text-xs font-black uppercase tracking-[0.4em]">Synchronize Access</span>
      <ChevronRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
    </button>
  );
}
