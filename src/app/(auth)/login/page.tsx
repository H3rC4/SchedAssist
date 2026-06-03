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
  searchParams: { error?: string; confirmed?: string; verified?: string; reset?: string };
}) {
  const { t, language } = useLandingTranslation();
  const error = searchParams?.error;
  const confirmed = searchParams?.confirmed === 'true';
  const verified = searchParams?.verified === 'true';
  const reset = searchParams?.reset === 'true';
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
    <div className="min-h-screen w-full flex items-center justify-center bg-white p-6 overflow-hidden relative">

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/[0.03] blur-[120px] rounded-full -z-10 pointer-events-none" />

      <AnimatePresence>
        {isSubmitting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-2xl"
          >
            <div className="relative">
              <div className="h-32 w-32 border-[6px] border-primary/10 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CalendarCheck className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>
            <p className="mt-12 text-xs font-black text-[#191c1e] uppercase tracking-[0.5em] animate-pulse">
              Authenticating
            </p>
            <p className="mt-4 text-[10px] font-bold text-[#191c1e]/40 uppercase tracking-widest">
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

        <div className="border border-primary/10 p-12 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none select-none">
            <span className="text-6xl font-black uppercase tracking-tighter text-primary">Login</span>
          </div>

          <header className="mb-12 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/10 bg-primary/[0.03] text-primary text-[9px] font-black uppercase tracking-[0.2em] mb-6">
              <Sparkles className="h-3 w-3" /> Next-Generation Access
            </div>
            <h1 className="text-4xl font-black text-[#191c1e] tracking-tighter uppercase mb-3">
              Welcome <br />
              <span className="text-primary italic">Back</span>
            </h1>
            <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em]">
              Precision Identity Access
            </p>
          </header>

           {confirmed && (
             <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-8 p-6 bg-emerald-50 border border-emerald-200 flex items-center gap-4"
             >
               <div className="h-10 w-10 bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                 <ShieldCheck className="h-5 w-5" />
               </div>
               <p className="text-sm font-bold text-emerald-800 tracking-tight">
                 Account verified. Access granted.
               </p>
             </motion.div>
           )}
           {verified && (
             <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-8 p-6 bg-emerald-50 border border-emerald-200 flex items-center gap-4"
             >
               <div className="h-10 w-10 bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                 <Mail className="h-5 w-5" />
               </div>
               <p className="text-sm font-bold text-emerald-800 tracking-tight">
                 Email verified successfully. You can now log in.
               </p>
             </motion.div>
           )}
           {reset && (
             <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-8 p-6 bg-emerald-50 border border-emerald-200 flex items-center gap-4"
             >
               <div className="h-10 w-10 bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                 <Loader2 className="h-5 w-5" />
               </div>
               <p className="text-sm font-bold text-emerald-800 tracking-tight">
                 Password has been reset. You can now log in with your new password.
               </p>
             </motion.div>
           )}

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

            <form action={handleSubmit} method="POST" className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-14 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                    placeholder="name@provider.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <label htmlFor="password" className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em]">
                    Secret Key
                  </label>
                  <Link href="/forgot-password" className="text-[9px] font-black text-primary uppercase tracking-widest hover:text-primary-light transition-all">
                    Recovery
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-14 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <SubmitButton />
              </div>
            </form>
          </div>

          <div className="mt-10 pt-8 border-t border-primary/10 flex flex-col items-center gap-4 text-center relative z-10">
            <p className="text-xs font-medium text-[#191c1e]/50">
              New to SchedAssist?{' '}
              <Link href="/register" className="text-primary font-black uppercase tracking-widest text-[10px] ml-2 hover:text-primary-light transition-colors">
                Create Account
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

function SubmitButton() {
  const { pending } = (require('react-dom') as any).useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-4 bg-primary text-white text-xs font-black uppercase tracking-[0.4em] transition-all shadow-xl shadow-primary/20 hover:bg-primary-light hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group"
    >
      <span>Synchronize Access</span>
      <ChevronRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
    </button>
  );
}
