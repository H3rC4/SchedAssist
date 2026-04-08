'use client';

import { useState } from 'react';
import { Loader2, CreditCard, ShieldCheck, CalendarCheck, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

export default function PayBridgePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePayNow() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'No se pudo iniciar el pago.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Error al conectar con la pasarela de pago.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] dark:bg-indigo-500/10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] dark:bg-amber-500/10" />

      <div className="max-w-2xl w-full relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl shadow-indigo-900/10 dark:shadow-black/50 border border-slate-200/50 dark:border-slate-800/50 p-10 md:p-16 text-center">
          <div className="h-20 w-20 bg-slate-900 dark:bg-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-xl shadow-indigo-900/10">
            <Zap className="h-10 w-10 text-amber-400 dark:text-slate-900" />
          </div>

          <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase mb-4 tracking-tight leading-none">
            ¡Bienvenido a SchedAssist!
          </h2>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-12 max-w-md mx-auto">
            Configura tu clínica y agiliza tu agenda hoy mismo. Elige cómo quieres empezar.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Trial Option */}
            <div className="group relative flex flex-col p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent hover:border-indigo-500/20 transition-all text-left">
              <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-6">
                <CalendarCheck className="h-6 w-6 text-indigo-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase mb-2">Prueba Gratis</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">7 días • Agenda Manual</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 flex-1">
                Configura profesionales, servicios y horarios. Prueba la gestión de citas sin compromiso.
              </p>
              <Link 
                href="/dashboard"
                className="w-full py-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
              >
                Empezar Prueba <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Pro Option */}
            <div className="group relative flex flex-col p-8 rounded-[2.5rem] bg-slate-900 dark:bg-amber-500 shadow-2xl shadow-indigo-900/20 text-left overflow-hidden">
               {/* Shine decoration */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-10 -mt-10" />
               
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md">
                <CreditCard className="h-6 w-6 text-white dark:text-slate-900" />
              </div>
              <h3 className="text-xl font-black text-white dark:text-slate-900 uppercase mb-2">Plan Pro</h3>
              <p className="text-xs font-bold text-indigo-300 dark:text-slate-800 uppercase tracking-widest mb-4">$70/mes • Full WhatsApp</p>
              <p className="text-sm text-indigo-100/70 dark:text-slate-800/80 mb-8 flex-1">
                Desbloquea el Agente de IA en WhatsApp, recordatorios automáticos y soporte prioritario.
              </p>
              <button 
                onClick={handlePayNow}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Activar Pro <Zap className="h-4 w-4 fill-current" /></>}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
               <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
