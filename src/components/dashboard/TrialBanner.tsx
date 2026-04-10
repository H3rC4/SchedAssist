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
  if (status !== 'trial' || !trialEndsAt) return null;

  const t = translations[lang] || translations['es'];

  const endsAt = new Date(trialEndsAt);
  const now = new Date();
  const diffTime = endsAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return (
    <div className="bg-red-600 text-white px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 animate-pulse" />
        <span className="text-sm font-black uppercase tracking-widest">{t.trial_expired || 'Tu periodo de prueba ha expirado'}</span>
      </div>
      <Link 
        href="/dashboard/whatsapp" 
        className="px-6 py-2 bg-white text-red-600 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
      >
        {t.whatsapp_banner.cta} por $70/mes
      </Link>
    </div>
  );

  return (
    <div className="bg-indigo-600 text-white px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5" />
        <span className="text-sm font-bold uppercase tracking-widest">
            {t.trial_mode || 'Estás en el periodo de prueba'}: <span className="font-black underline decoration-indigo-300 decoration-2 underline-offset-4">{diffDays} {t.days_left || 'días restantes'}</span>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <p className="hidden md:block text-[10px] font-bold uppercase tracking-widest opacity-80 italic">{t.whatsapp_blocked || 'WhatsApp bloqueado hasta el pago'}</p>
        <Link 
          href="/dashboard/whatsapp" 
          className="px-6 py-2 bg-amber-500 text-slate-900 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2"
        >
          {t.unlock_whatsapp || 'Desbloquear WhatsApp'} <Zap className="h-3 w-3 fill-current" />
        </Link>
      </div>
    </div>
  );
}
