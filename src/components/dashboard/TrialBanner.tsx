'use client';

import { Zap, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { translations, Language } from '@/lib/i18n';

interface TrialBannerProps {
  status: string;
  trialEndsAt: string | null;
  lang?: Language;
}

export function TrialBanner({ status, trialEndsAt, lang = 'es' }: TrialBannerProps) {
  const t = translations[lang] || translations['es'];

  // Only show for trial status
  if (!['trial', 'trialing'].includes(status) || !trialEndsAt) return null;

  const endsAt = new Date(trialEndsAt);
  const now = new Date();
  const diffTime = endsAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Grace period: trial ended but status is still 'trial' (3 days)
  const isInGracePeriod = diffDays < 0 && diffDays >= -3;
  // Fully expired: grace period also passed
  const isFullyExpired = diffDays < -3;

  // If fully expired (grace period passed), don't show banner here 
  // (TrialExpiredGate will block the dashboard)
  if (isFullyExpired) return null;

  // Grace period: show yellow warning banner
  if (isInGracePeriod) {
    const graceDaysLeft = Math.abs(diffDays);
    return (
      <div className="bg-amber-50 text-amber-900 px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-700 relative z-[60] border-b border-amber-200">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
        <div className="flex items-center gap-5">
          <div className="h-10 w-10 bg-amber-100 border border-amber-200 flex items-center justify-center rounded-none">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-amber-600/60 mb-0.5">
              {t.trial_grace_period || 'Periodo de gracia'}
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-amber-900 italic">
              {graceDaysLeft} {graceDaysLeft === 1 ? 'día' : 'días'} remaining
            </span>
          </div>
        </div>
        <Link
          href="/dashboard/pay"
          className="flex items-center gap-3 px-8 py-3 bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-amber-600 transition-all shadow-lg rounded-full"
        >
          {t.upgrade_to_continue || 'Upgrade to continue'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  // Normal trial banner (still in trial period)
  return (
    <div className="bg-primary text-white px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-700 relative z-[60] border-b border-primary/20">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary-light" />
      <div className="flex items-center gap-5">
        <div className="h-10 w-10 bg-white/10 border border-white/20 flex items-center justify-center rounded-none">
          <Clock className="h-5 w-5 text-white/70" />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/40 mb-0.5">
            {t.trial_mode || 'Trial Period'}
          </span>
          <span className="text-xs font-black uppercase tracking-widest text-white italic">
            {diffDays} {t.days_left || 'days left'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <p className="hidden md:block text-[9px] font-black uppercase tracking-[0.3em] opacity-40 italic">
          {t.whatsapp_blocked || 'WhatsApp blocked until payment'}
        </p>
        <Link
          href="/dashboard/pay"
          className="flex items-center gap-3 px-6 py-3 bg-white text-primary text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white/90 transition-all shadow-lg rounded-full"
        >
          <span>{t.unlock_whatsapp || 'Unlock'}</span>
          <Zap className="h-3.5 w-3.5 fill-current" />
        </Link>
      </div>
    </div>
  );
}