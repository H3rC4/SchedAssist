'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Calendar, Loader2 } from 'lucide-react';
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
