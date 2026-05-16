'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  CreditCard, Calendar, Loader2, FileText, Download, AlertCircle,
  ShieldCheck, Check, ArrowUpRight, Zap, Globe, Building2, Users,
  Briefcase, MapPin, TrendingUp
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { translations, Language } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: string;
  currency: string;
  plan: string;
  gateway: string;
  pdfUrl: string | null;
}

interface PlanInfo {
  tier: string;
  name: string;
  payment_gateway: string;
  billing_cycle: string;
  subscription_status: string;
}

interface UsageData {
  professionals: { current: number; max: number };
  services: { current: number; max: number };
  locations: { current: number; max: number };
  appointments: { current: number; max: number };
  patients: { current: number; max: number };
}

const PLAN_CONFIGS = [
  {
    tier: 'basic',
    name: 'Starter',
    price: '$39',
    priceARS: '$60.000',
    features: ['1 profesional', 'Servicios ilimitados', '1 ubicación', '150 turnos/mes', 'WhatsApp'],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: '$59',
    priceARS: '$90.000',
    features: ['5 profesionales', 'Servicios ilimitados', '2 ubicaciones', 'Turnos ilimitados', 'WhatsApp auto', 'API'],
    popular: true,
  },
  {
    tier: 'premium',
    name: 'Premium',
    price: '$129',
    priceARS: '$195.000',
    features: ['Profesionales ilimitados', 'Todo ilimitado', 'Dominio propio', 'White-label', 'API + Webhooks'],
  },
];

export default function BillingSettingsPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Language>('es');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: tuData } = await supabase
          .from('tenant_users')
          .select('tenants(id, name, plan_tier, payment_gateway, billing_cycle, subscription_status, settings, max_professionals, max_services, max_locations, max_appointments_per_month, max_patients)')
          .eq('user_id', user.id)
          .single();
        
        if (tuData?.tenants) {
          const tenant = tuData.tenants as any;
          setLang((tenant.settings?.language as Language) || 'es');
          setPlanInfo({
            tier: tenant.plan_tier || 'pro',
            name: PLAN_CONFIGS.find(p => p.tier === (tenant.plan_tier || 'pro'))?.name || 'Pro',
            payment_gateway: tenant.payment_gateway || 'stripe',
            billing_cycle: tenant.billing_cycle || 'monthly',
            subscription_status: tenant.subscription_status || 'trialing',
          });

          // Fetch usage counts
          const tenantId = tenant.id;
          const [{ count: profCount }, { count: servCount }, { count: locCount }, { count: apptCount }, { count: patCount }] = await Promise.all([
            supabase.from('professionals').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
            supabase.from('services').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
            supabase.from('locations').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
            supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
            supabase.from('clients').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
          ]);

          setUsage({
            professionals: { current: profCount || 0, max: tenant.max_professionals || 5 },
            services: { current: servCount || 0, max: tenant.max_services || -1 },
            locations: { current: locCount || 0, max: tenant.max_locations || 2 },
            appointments: { current: apptCount || 0, max: tenant.max_appointments_per_month || -1 },
            patients: { current: patCount || 0, max: tenant.max_patients || -1 },
          });
        }
      }

      // Cargar facturas
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
      if (invoice.pdfUrl.startsWith('http')) {
        window.open(invoice.pdfUrl, '_blank');
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleUpgrade = (planTier: string) => {
    const gateway = planInfo?.payment_gateway || 'stripe';
    fetch(`/api/checkout/${gateway}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planTier, billing_cycle: planInfo?.billing_cycle || 'monthly' }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.url) {
        window.location.href = data.url;
      }
    });
  };

  const t = (translations[lang] || translations['es']) as any;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-500';
      case 'trialing': return 'bg-amber-500/10 text-amber-500';
      case 'inactive': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'trialing': return 'Trial';
      case 'inactive': return 'Inactivo';
      default: return status;
    }
  };

  const UsageBar = ({ label, current, max, icon: Icon }: { label: string; current: number; max: number; icon: any }) => {
    const isUnlimited = max === -1;
    const percentage = isUnlimited ? 0 : Math.min((current / max) * 100, 100);
    const isNearLimit = !isUnlimited && percentage > 80;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-primary/40" />
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface/60">{label}</span>
          </div>
          <span className={`text-[10px] font-black ${isNearLimit ? 'text-amber-600' : 'text-on-surface/40'}`}>
            {isUnlimited ? `${current} / ∞` : `${current} / ${max}`}
          </span>
        </div>
        {!isUnlimited && (
          <div className="h-1.5 bg-on-surface/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${isNearLimit ? 'bg-amber-500' : 'bg-primary'}`}
            />
          </div>
        )}
      </div>
    );
  };

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

      {/* Plan Current Card */}
      {planInfo && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary rounded-[2rem] p-8 text-white shadow-2xl shadow-primary/30 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none select-none">
            <ShieldCheck className="h-32 w-32" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
                    Plan Actual
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(planInfo.subscription_status)}`}>
                    {getStatusLabel(planInfo.subscription_status)}
                  </span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase mb-2">
                  {planInfo.name}
                </h2>
                
                <div className="flex items-center gap-4 text-white/60">
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {planInfo.payment_gateway === 'mercadopago' ? 'Mercado Pago' : 'Stripe'}
                  </span>
                  <span className="text-white/20">|</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {planInfo.billing_cycle === 'yearly' ? 'Facturación anual' : 'Facturación mensual'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <Zap className="h-3.5 w-3.5" />
                Cambiar Plan
              </button>
            </div>

            {/* Usage Bars */}
            {usage && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <UsageBar label="Profesionales" current={usage.professionals.current} max={usage.professionals.max} icon={Users} />
                <UsageBar label="Servicios" current={usage.services.current} max={usage.services.max} icon={Briefcase} />
                <UsageBar label="Ubicaciones" current={usage.locations.current} max={usage.locations.max} icon={MapPin} />
                <UsageBar label="Turnos/mes" current={usage.appointments.current} max={usage.appointments.max} icon={Calendar} />
                <UsageBar label="Pacientes" current={usage.patients.current} max={usage.patients.max} icon={Users} />
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] p-8 md:p-12 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-black text-on-surface tracking-tighter uppercase">
                  Comparar <span className="text-primary italic">Planes</span>
                </h2>
                <button 
                  onClick={() => setShowUpgradeModal(false)}
                  className="h-10 w-10 rounded-full bg-on-surface/5 flex items-center justify-center hover:bg-on-surface/10 transition-colors"
                >
                  <span className="text-on-surface/40 text-lg">×</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLAN_CONFIGS.map((plan) => (
                  <div
                    key={plan.tier}
                    className={`p-6 rounded-2xl border ${
                      plan.tier === planInfo?.tier
                        ? 'border-primary bg-primary/5'
                        : 'border-on-surface/5 hover:border-primary/20'
                    } transition-all`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-on-surface uppercase tracking-wider">{plan.name}</h3>
                      {plan.tier === planInfo?.tier && (
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">Actual</span>
                      )}
                    </div>
                    
                    <div className="mb-6">
                      <span className="text-3xl font-black text-on-surface">{plan.price}</span>
                      <span className="text-xs text-on-surface/40 ml-1">/mes USD</span>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-xs font-bold text-on-surface/60">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.tier !== planInfo?.tier && (
                      <button
                        onClick={() => handleUpgrade(plan.tier)}
                        className="w-full py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-light transition-all flex items-center justify-center gap-2"
                      >
                        <span>{plan.tier === 'basic' ? 'Downgrade' : 'Upgrade'}</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-on-surface/30 uppercase tracking-widest">{invoice.id}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                        invoice.gateway === 'stripe' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {invoice.gateway}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-8">
                  <div className="text-right">
                    <span className="text-base md:text-lg font-black text-on-surface">{invoice.amount}</span>
                    <p className="text-[9px] font-bold text-on-surface/30 uppercase tracking-widest">{invoice.plan}</p>
                  </div>
                  {invoice.pdfUrl && (
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
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
