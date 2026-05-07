'use client';

import { useState } from 'react';
import { Loader2, CreditCard, ShieldCheck, CalendarCheck, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from 'next/navigation';

export default function PayBridgePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleStripePay() {
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
        setError(data.error || 'No se pudo iniciar el pago con Stripe.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Stripe checkout error:', err);
      setError('Error al conectar con Stripe.');
      setLoading(false);
    }
  }

  const initialOptions = {
    "clientId": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
    currency: "USD",
    intent: "capture",
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] dark:bg-indigo-500/10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] dark:bg-amber-500/10" />

        <div className="max-w-4xl w-full relative z-10">
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

            <div className="grid md:grid-cols-3 gap-6">
              {/* Trial Option */}
              <div className="group relative flex flex-col p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent hover:border-indigo-500/20 transition-all text-left">
                <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-6">
                  <CalendarCheck className="h-6 w-6 text-indigo-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase mb-2">Prueba Gratis</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">7 días • Manual</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 flex-1">
                  Configura profesionales y servicios. Prueba la gestión de citas.
                </p>
                <Link 
                  href="/dashboard"
                  className="w-full py-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                >
                  Probar <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Stripe Option */}
              <div className="group relative flex flex-col p-8 rounded-[2.5rem] bg-slate-900 dark:bg-slate-800 shadow-2xl shadow-indigo-900/20 text-left overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-10 -mt-10" />
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-black text-white uppercase mb-2">Plan Pro (Stripe)</h3>
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4">$70/mes • Suscripción</p>
                <p className="text-sm text-indigo-100/70 mb-8 flex-1">
                  Paga con tarjeta de crédito/débito a través de Stripe.
                </p>
                <button 
                  onClick={handleStripePay}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-white text-slate-900 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Pagar con Tarjeta <Zap className="h-4 w-4 fill-current text-amber-500" /></>}
                </button>
              </div>

              {/* PayPal Option */}
              <div className="group relative flex flex-col p-8 rounded-[2.5rem] bg-amber-500 shadow-2xl shadow-amber-900/20 text-left overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-3xl -mr-10 -mt-10" />
                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center mb-6 backdrop-blur-md">
                  <span className="font-black text-slate-900">PP</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase mb-2">Plan Pro (PayPal)</h3>
                <p className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">$70 • Pago Único / Mes</p>
                <p className="text-sm text-slate-800/80 mb-8 flex-1">
                  Activa tu plan Pro al instante usando tu cuenta de PayPal.
                </p>
                
                <div className="relative z-10 min-h-[50px]">
                  <PayPalButtons 
                    style={{ 
                      layout: "vertical", 
                      color: "white", 
                      shape: "pill", 
                      label: "pay",
                      height: 48
                    }}
                    createOrder={async () => {
                      const res = await fetch("/api/checkout/paypal", { method: "POST" });
                      const data = await res.json();
                      return data.id;
                    }}
                    onApprove={async (data) => {
                      setLoading(true);
                      const res = await fetch("/api/checkout/paypal/capture", {
                        method: "POST",
                        body: JSON.stringify({ orderID: data.orderID }),
                      });
                      const captureData = await res.json();
                      if (captureData.status === 'COMPLETED') {
                        setSuccess(true);
                        setTimeout(() => {
                          router.push('/dashboard/whatsapp?success=true');
                        }, 2000);
                      } else {
                        setError('El pago de PayPal no se pudo completar.');
                        setLoading(false);
                      }
                    }}
                    onError={(err) => {
                      console.error("PayPal Error:", err);
                      setError("Error al procesar el pago con PayPal.");
                    }}
                  />
                </div>
              </div>
            </div>

            {success && (
              <div className="mt-8 p-6 bg-green-500 rounded-3xl border border-green-400 shadow-xl shadow-green-900/20 animate-bounce">
                 <div className="flex items-center justify-center gap-3">
                   <ShieldCheck className="h-6 w-6 text-white" />
                   <p className="text-sm font-black text-white uppercase tracking-widest">¡Pago Exitoso! Activando tu cuenta...</p>
                 </div>
              </div>
            )}

            {error && (
              <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                 <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
