'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Calendar, Loader2, FileText, Download, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { translations, Language } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: string;
  pdfUrl: string;
}

export default function BillingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Language>('es');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

      // Cargar facturas reales de Stripe
      try {
        const res = await fetch('/api/billing/invoices');
        const data = await res.json();
        if (data.invoices) {
          setInvoices(data.invoices);
        } else if (data.error) {
          setError(data.error);
        }
      } catch (err) {
        setError('Error loading invoices');
      }
      
      setLoading(false);
    };
    loadData();
  }, []);

  const handleDownloadPDF = async (invoice: Invoice) => {
    if (!invoice.pdfUrl) return;
    setDownloadingId(invoice.id);
    try {
      // Si es una URL de Stripe, abrirla directamente
      if (invoice.pdfUrl.startsWith('http')) {
        window.open(invoice.pdfUrl, '_blank');
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const t = (translations[lang] || translations['es']) as any;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 md:space-y-16 animate-in fade-in duration-700">
      <header>
        <h1 className="text-2xl md:text-4xl font-black text-on-surface tracking-tighter uppercase mb-2">
          {t.billing_settings?.split(' ')[0]} <span className="text-primary italic font-serif lowercase">& {t.billing_settings?.split(' ').slice(1).join(' ')}</span>
        </h1>
        <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.4em]">
          {t.billing_desc}
        </p>
      </header>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4"
          >
            <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-sm font-bold text-red-800">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoices */}
      <section className="space-y-4 md:space-y-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl md:text-2xl font-black text-on-surface tracking-tighter uppercase">{t.billing_history}</h3>
          {invoices.length > 0 && (
            <span className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest">
              {invoices.length} {lang === 'it' ? 'fatture' : lang === 'es' ? 'facturas' : 'invoices'}
            </span>
          )}
        </div>

        {invoices.length === 0 ? (
          <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-primary/10 p-12 md:p-16 shadow-spatial text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-primary/20" />
            </div>
            <h4 className="text-lg font-black text-on-surface uppercase tracking-tight mb-2">
              {lang === 'it' ? 'Nessuna fattura disponibile' : lang === 'es' ? 'No hay facturas disponibles' : 'No invoices available'}
            </h4>
            <p className="text-sm text-on-surface/40 font-medium max-w-md mx-auto">
              {lang === 'it' 
                ? 'Le fatture appariranno qui dopo il primo pagamento.' 
                : lang === 'es' 
                ? 'Las facturas aparecerán aquí después del primer pago.' 
                : 'Invoices will appear here after the first payment.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {invoices.map((invoice, idx) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[1.25rem] md:rounded-[1.5rem] border border-on-surface/5 p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-primary/20 transition-all"
              >
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-on-surface/[0.03] flex items-center justify-center text-on-surface/20 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-on-surface uppercase tracking-tight">{invoice.date}</p>
                    <p className="text-[10px] font-bold text-on-surface/30 uppercase tracking-widest">{invoice.id}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-8">
                  <span className="text-base md:text-lg font-black text-on-surface">{invoice.amount}</span>
                  <button
                    onClick={() => handleDownloadPDF(invoice)}
                    disabled={downloadingId === invoice.id}
                    className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:underline disabled:opacity-50 transition-all"
                  >
                    {downloadingId === invoice.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                    {t.download_pdf}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
