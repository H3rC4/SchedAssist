'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Zap, Calendar, ArrowUpRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { translations, Language } from '@/lib/i18n';

export default function BillingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Language>('es');

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: tuData } = await supabase
          .from('tenant_users')
          .select('tenants(settings)')
          .eq('user_id', user.id)
          .single();
        
        if (tuData?.tenants) {
          const settings = (tuData.tenants as any).settings;
          setLang((settings?.language as Language) || 'es');
        }
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const t = (translations[lang] || translations['es']) as any;

  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleManageSubscription = async () => {
    setIsRedirecting(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Error redirecting to Stripe');
      }
    } catch (err) {
      alert('Error redirecting to Stripe');
    } finally {
      setIsRedirecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <header>
        <h1 className="text-4xl font-black text-on-surface tracking-tighter uppercase mb-2">
          {t.billing_settings?.split(' ')[0]} <span className="text-primary italic font-serif lowercase">& {t.billing_settings?.split(' ').slice(1).join(' ')}</span>
        </h1>
        <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.4em]">
          {t.billing_desc}
        </p>
      </header>

      {/* Current Plan */}
      <section className="bg-primary rounded-[3rem] p-12 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
        <Zap className="absolute top-[-2rem] right-[-2rem] h-64 w-64 text-white/5 rotate-12" />
        
        <div className="relative z-10 space-y-10">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/60">{t.current_plan}</h2>
              <p className="text-5xl font-black tracking-tighter uppercase">{t.professional_plus || 'Professional'} <span className="text-white/40 italic">Plus</span></p>
            </div>
            <div className="px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest">
              {t.renews_on ? t.renews_on('May 24, 2026') : 'Renews May 24, 2026'}
            </div>
          </div>

          <div className="flex items-center gap-12">
             <div className="space-y-1">
               <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t.monthly_cost}</p>
               <p className="text-3xl font-black">$89.00 <span className="text-xs text-white/40 font-bold italic">/ mo</span></p>
             </div>
             <div className="h-12 w-[1px] bg-white/10" />
             <div className="space-y-1">
               <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t.payment_method}</p>
               <p className="text-lg font-black uppercase tracking-tight">Visa ending in •••• 4242</p>
             </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleManageSubscription}
              disabled={isRedirecting}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white text-primary px-8 py-4 rounded-2xl hover:bg-surface transition-all active:scale-95 disabled:opacity-50"
            >
              {isRedirecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t.manage_subscription} <ArrowUpRight className="h-4 w-4" /></>}
            </button>

            <button 
              onClick={handleManageSubscription}
              disabled={isRedirecting}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 text-white border border-white/20 px-8 py-4 rounded-2xl hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {t.cancel_subscription}
            </button>
          </div>
        </div>
      </section>

      {/* Invoices */}
      <section className="space-y-8">
        <h3 className="text-2xl font-black text-on-surface tracking-tighter uppercase px-2">{t.billing_history}</h3>
        <div className="space-y-4">
          {[
            { date: 'Apr 24, 2026', amount: '$89.00', id: 'INV-42981' },
            { date: 'Mar 24, 2026', amount: '$89.00', id: 'INV-42856' },
            { date: 'Feb 24, 2026', amount: '$89.00', id: 'INV-42722' },
          ].map((inv, idx) => (
            <div key={idx} className="bg-white rounded-[1.5rem] border border-on-surface/5 p-6 flex items-center justify-between group hover:border-primary/20 transition-all cursor-pointer">
              <div className="flex items-center gap-6">
                 <div className="h-12 w-12 rounded-xl bg-on-surface/[0.03] flex items-center justify-center text-on-surface/20 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                   <Calendar className="h-5 w-5" />
                 </div>
                 <div>
                   <p className="text-sm font-black text-on-surface uppercase tracking-tight">{inv.date}</p>
                   <p className="text-[10px] font-bold text-on-surface/30 uppercase tracking-widest">{inv.id}</p>
                 </div>
              </div>
              <div className="flex items-center gap-8">
                <span className="text-lg font-black text-on-surface">{inv.amount}</span>
                <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">{t.download_pdf}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
