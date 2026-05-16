"use client";

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, X } from 'lucide-react';

interface PlanLimitReachedProps {
  feature: string;
  current: number;
  limit: number;
  upgradePlan?: string;
  translations?: {
    limit_reached?: string;
    limit_message?: string;
    upgrade_plan?: string;
  };
}

export function PlanLimitReached({ 
  feature, 
  current, 
  limit, 
  upgradePlan = 'pro',
  translations: t
}: PlanLimitReachedProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-6 bg-amber-50 border border-amber-200 rounded-xl"
    >
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 rounded-lg">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-amber-800 uppercase tracking-wider">
            {t?.limit_reached || 'Límite alcanzado'}
          </h3>
          <p className="mt-2 text-sm text-amber-700 leading-relaxed">
            {t?.limit_message 
              ? t.limit_message.replace('{limit}', String(limit)).replace('{feature}', feature).replace('{current}', String(current))
              : <>Has alcanzado el límite de <strong>{limit}</strong> {feature}. Actualmente tienes <strong>{current}</strong> {feature}.</>
            }
          </p>
          <div className="mt-4">
            <button
              onClick={() => router.push(`/dashboard/settings/billing?upgrade=${upgradePlan}`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-black uppercase tracking-widest transition-all hover:bg-primary-light hover:scale-[1.02] active:scale-95"
            >
              <span>{t?.upgrade_plan || 'Actualizar Plan'}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
