'use client';

import { Zap, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { translations, Language } from '@/lib/i18n';

interface TrialBannerProps {
  status: string;
  trialEndsAt: string | null;
  lang?: Language;
}

export function TrialBanner({ status, trialEndsAt, lang = 'es' }: TrialBannerProps) {
  if (!['trial', 'trialing'].includes(status) || !trialEndsAt) return null;

  const t = translations[lang] || translations['es'];

  const endsAt = new Date(trialEndsAt);
  const now = new Date();
  const diffTime = endsAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return (
    <div className="bg-red-950 text-white px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-700 relative z-[60] border-b border-red-500/30">
      <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
      <div className="flex items-center gap-5">
        <div className="h-10 w-10 bg-red-600/20 border border-red-500/30 flex items-center justify-center rounded-none">
          <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-100">{t.trial_expired || 'Tu periodo de prueba ha expirado'}</span>
      </div>
      <Link
        href="/dashboard/settings/whatsapp"
        className="px-8 py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-red-500 transition-all shadow-xl shadow-red-900/50 rounded-none border border-transparent hover:border-red-400"
      >
        {t.whatsapp_banner?.cta || 'Actualizar'} por $79/mes
      </Link>
    </div>
  );

  return (
    <div className="bg-primary-950 text-white px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-700 relative z-[60] border-b border-primary/20">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      <div className="flex items-center gap-5">
        <div className="h-10 w-10 bg-primary/20 border border-primary/30 flex items-center justify-center rounded-none">
          <Clock className="h-5 w-5 text-primary-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[0.5em] text-primary-400/60 mb-0.5">
            {t.trial_mode || 'Estás en el periodo de prueba'}
          </span>
          <span className="text-xs font-black uppercase tracking-widest text-white italic">
            {diffDays} {t.days_left || 'días restantes'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <p className="hidden md:block text-[9px] font-black uppercase tracking-[0.3em] opacity-40 italic">
          {t.whatsapp_blocked || 'WhatsApp blocked until payment'}
        </p>
        <Link
          href="/dashboard/settings/whatsapp"
          className="precision-button-primary flex items-center gap-3"
        >
          <span>{t.unlock_whatsapp || 'Unlock WhatsApp'}</span>
          <Zap className="h-3.5 w-3.5 fill-current group-hover:scale-110 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
