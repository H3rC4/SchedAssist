'use client';

import { Zap, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface TrialBannerProps {
  status: string;
  trialEndsAt: string | null;
}

export function TrialBanner({ status, trialEndsAt }: TrialBannerProps) {
  if (status !== 'trial' || !trialEndsAt) return null;

  const endsAt = new Date(trialEndsAt);
  const now = new Date();
  const diffTime = endsAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return (
    <div className="bg-red-600 text-white px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 animate-pulse" />
        <span className="text-sm font-black uppercase tracking-widest">Tu periodo de prueba ha expirado</span>
      </div>
      <Link 
        href="/dashboard/whatsapp" 
        className="px-6 py-2 bg-white text-red-600 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
      >
        Activar ahora por $70/mes
      </Link>
    </div>
  );

  return (
    <div className="bg-indigo-600 text-white px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5" />
        <span className="text-sm font-bold uppercase tracking-widest">
            Estás en el periodo de prueba: <span className="font-black underline decoration-indigo-300 decoration-2 underline-offset-4">{diffDays} días restantes</span>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <p className="hidden md:block text-[10px] font-bold uppercase tracking-widest opacity-80 italic">WhatsApp bloqueado hasta el pago</p>
        <Link 
          href="/dashboard/whatsapp" 
          className="px-6 py-2 bg-amber-500 text-slate-900 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2"
        >
          Desbloquear WhatsApp <Zap className="h-3 w-3 fill-current" />
        </Link>
      </div>
    </div>
  );
}
