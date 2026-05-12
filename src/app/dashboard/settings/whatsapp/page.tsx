'use client';

import { useEffect, useState } from 'react';
import { Smartphone, CheckCircle2, Zap, Loader2, QrCode, Plus, MessageSquare, Trash2, ArrowRight, X, AlertCircle, ArrowUpRight, Sparkles, CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { translations, Language } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';

export default function WhatsAppSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [lang, setLang] = useState<Language>('es');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ label: '', phone_number_id: '', access_token: '' });
  const [formError, setFormError] = useState('');

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

  const handleSubscribe = async () => {
    setIsRedirecting(true);
    setCheckoutError(null);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || 'Error starting checkout');
      }
    } catch (err) {
      setCheckoutError('Error connecting to payment gateway');
    } finally {
      setIsRedirecting(false);
    }
  };

  const t = (translations[lang] || translations['es']) as any;

  const fetchData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: tuData } = await supabase
      .from('tenant_users')
      .select('tenant_id, tenants(*)')
      .eq('user_id', user.id)
      .single();

    if (tuData?.tenants) {
      const tenantData = tuData.tenants as any;
      setTenant(tenantData);
      setLang((tenantData.settings?.language as Language) || 'es');
      setRemindersEnabled(tenantData.settings?.reminder_enabled !== false);
      
      const res = await fetch(`/api/settings/whatsapp?tenant_id=${tenantData.id}`);
      const data = await res.json();
      setAccounts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newAccount.phone_number_id || !newAccount.access_token) {
      setFormError('ID and Token are required');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/settings/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAccount, tenant_id: tenant.id })
      });
      const data = await res.json();
      if (data.success) {
        setNewAccount({ label: '', phone_number_id: '', access_token: '' });
        setShowAddForm(false);
        fetchData();
      } else {
        setFormError(data.error || 'Error saving configuration');
      }
    } catch (error) {
      setFormError('Network error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;
    try {
      await fetch(`/api/settings/whatsapp?id=${id}&tenant_id=${tenant.id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      alert('Error deleting account');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const isConnected = accounts.length > 0;

  return (
    <div className="space-y-10 md:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8 relative">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -z-10" />
        <div>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-on-surface tracking-tighter uppercase mb-2">
            {t.whatsapp_integration?.split(' ')[0]} <span className="text-primary italic font-serif lowercase">{t.whatsapp_integration?.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.4em]">
            {t.whatsapp_integration_desc}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 md:px-8 py-3 md:py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group shrink-0"
        >
          {showAddForm ? (
            <>
              <X className="h-4 w-4" />
              <span>{t.cancel}</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>{t.add_account}</span>
            </>
          )}
        </button>
      </header>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.section
            initial={{ height: 0, opacity: 0, y: -20 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[1.5rem] md:rounded-[3rem] border border-primary/20 p-6 md:p-10 shadow-spatial space-y-6 md:space-y-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none select-none">
                <Plus className="h-24 w-24 text-primary" />
              </div>

              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h3 className="text-lg md:text-xl font-black text-on-surface uppercase tracking-tight">{t.connect_business}</h3>
              </div>

              <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <div className="space-y-3 md:space-y-4">
                   <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">{t.account_label}</label>
                   <div className="relative group/input">
                     <input
                       type="text"
                       value={newAccount.label}
                       onChange={e => setNewAccount({...newAccount, label: e.target.value})}
                       className="w-full h-12 md:h-16 bg-primary/[0.06] rounded-2xl border border-primary/20 px-4 md:px-6 font-bold text-on-surface focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                       placeholder="e.g. Main Clinic WhatsApp"
                     />
                   </div>
                </div>
                <div className="space-y-3 md:space-y-4">
                   <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">{t.phone_id_label}</label>
                   <div className="relative group/input">
                     <input
                       type="text"
                       value={newAccount.phone_number_id}
                       onChange={e => setNewAccount({...newAccount, phone_number_id: e.target.value})}
                       className="w-full h-12 md:h-16 bg-primary/[0.06] rounded-2xl border border-primary/20 px-4 md:px-6 font-bold text-on-surface focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                     />
                   </div>
                </div>
                <div className="md:col-span-2 space-y-3 md:space-y-4">
                   <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">{t.token_label}</label>
                   <div className="relative group/input">
                     <input
                       type="password"
                       value={newAccount.access_token}
                       onChange={e => setNewAccount({...newAccount, access_token: e.target.value})}
                       className="w-full h-12 md:h-16 bg-primary/[0.06] rounded-2xl border border-primary/20 px-4 md:px-6 font-bold text-on-surface focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                     />
                   </div>
                </div>
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="md:col-span-2 p-4 md:p-6 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-4"
                  >
                    <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    {formError}
                  </motion.div>
                )}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="md:col-span-2 h-14 md:h-20 bg-primary text-white rounded-[1.5rem] md:rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-xl shadow-primary/20 hover:bg-primary-light hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                      <span>{t.confirm_integration}</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Current Plan / Subscription Status */}
      <section className={`rounded-[2rem] md:rounded-[4rem] p-6 md:p-12 text-white shadow-2xl shadow-primary/30 relative overflow-hidden group ${tenant?.subscription_status === 'active' ? 'bg-primary' : 'bg-amber-600'}`}>
        <div className="absolute top-[-4rem] right-[-4rem] h-96 w-96 bg-white/5 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-1000" />
        <Zap className="absolute top-[-2rem] right-[-2rem] h-64 w-64 text-white/5 rotate-12 group-hover:rotate-[30deg] transition-transform duration-1000" />

        <div className="relative z-10 space-y-8 md:space-y-12">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[9px] font-black uppercase tracking-[0.2em]">
                <Sparkles className="h-3 w-3" />
                {tenant?.subscription_status === 'active' ? t.active_status : (t.trial_mode || 'Trial')}
              </div>
              <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/40">{t.current_plan}</h2>
              <p className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-none">
                {t.professional_plus?.split(' ')[0]} <span className="text-white/30 italic font-serif lowercase">{t.professional_plus?.split(' ').slice(1).join(' ')}</span>
              </p>
            </div>
            {tenant?.subscription_status === 'active' && (
              <div className="px-6 md:px-8 py-3 md:py-4 bg-white/10 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] border border-white/20 text-[10px] font-black uppercase tracking-[0.3em] flex flex-col items-center gap-1 shadow-lg">
                <span className="text-white/40 text-[8px] tracking-[0.4em]">{t.renews_on ? t.renews_on('MAY 24, 2026').split(' ')[0] : 'Renews'}</span>
                <span className="text-base md:text-lg tracking-tighter">MAY 24, 2026</span>
              </div>
            )}
          </div>

          {tenant?.subscription_status === 'active' ? (
            <div className="flex flex-wrap items-center gap-8 md:gap-16">
               <div className="space-y-2">
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{t.monthly_cost}</p>
                 <p className="text-3xl md:text-4xl font-black tracking-tight">$79.00 <span className="text-sm text-white/30 font-bold italic lowercase">/ mo</span></p>
               </div>
               <div className="h-16 w-[1px] bg-white/10 hidden md:block" />
               <div className="space-y-2">
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{t.payment_method}</p>
                 <div className="flex items-center gap-4">
                   <div className="h-10 w-14 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                     <CreditCard className="h-6 w-6" />
                   </div>
                   <p className="text-lg md:text-xl font-black uppercase tracking-tight">Visa •••• 4242</p>
                 </div>
               </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
              <p className="text-sm font-bold text-white/80 leading-relaxed">
                {lang === 'es'
                  ? 'Estás en modo de prueba. Suscríbete para activar WhatsApp y desbloquear todas las funciones.'
                  : lang === 'it'
                  ? 'Sei in modalità prova. Abbonati per attivare WhatsApp e sbloccare tutte le funzioni.'
                  : 'You are in trial mode. Subscribe to activate WhatsApp and unlock all features.'}
              </p>
            </div>
          )}

          {/* Error message */}
          <AnimatePresence>
            {checkoutError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-500/20 border border-red-400/30 rounded-2xl text-white text-xs font-bold"
              >
                {checkoutError}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-4 md:gap-6 pt-4">
{tenant?.subscription_status === 'active' ? (
              <>
                <button
                  onClick={handleManageSubscription}
                  disabled={isRedirecting}
                  className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] bg-white text-primary px-6 md:px-10 py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] hover:bg-slate-50 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-white/10 group/btn"
                >
                  {isRedirecting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      <span>{t.manage_subscription}</span>
                      <ArrowUpRight className="h-5 w-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  onClick={handleManageSubscription}
                  disabled={isRedirecting}
                  className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] bg-white/10 text-white border border-white/20 px-6 md:px-10 py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {t.cancel_subscription}
                </button>
              </>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={isRedirecting}
                className="flex items-center gap-3 text-sm md:text-base font-black uppercase tracking-[0.3em] bg-white text-amber-700 px-8 md:px-12 py-5 md:py-6 rounded-[1.5rem] md:rounded-[2rem] hover:bg-slate-50 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 shadow-2xl shadow-white/20 group/btn animate-pulse"
              >
                {isRedirecting ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                  <>
                    <span>{t.subscribe_now || 'Suscribirse por $79/mes'}</span>
                    <ArrowUpRight className="h-6 w-6 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Integration Status Card */}
      <section className="bg-white rounded-[1.5rem] md:rounded-[3rem] border border-primary/10 p-6 md:p-16 shadow-spatial relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none select-none group-hover:opacity-[0.05] transition-opacity">
          <Smartphone className="h-48 w-48 text-primary" />
        </div>

        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 md:gap-16 relative z-10">
          <div className="space-y-6 md:space-y-10 flex-1">
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-xl md:text-2xl font-black text-on-surface uppercase tracking-tight">
                {t.integration_status}
              </h3>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-3 px-4 md:px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                  isConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  {isConnected ? t.active_instance : t.link_required}
                </div>
              </div>
            </div>

            <p className="text-sm font-medium text-on-surface/50 leading-relaxed max-w-lg">
              {isConnected
                ? t.whatsapp_active_desc
                : t.whatsapp_inactive_desc}
            </p>

            <div className="flex flex-wrap gap-3 md:gap-4">
              {accounts.map(acc => (
                <div key={acc.id} className="flex items-center gap-3 md:gap-4 bg-primary/[0.03] px-5 md:px-8 py-3 md:py-4 rounded-[1.5rem] border border-primary/10 group/acc hover:border-primary/30 transition-all">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">{acc.label}</span>
                  <button onClick={() => handleDeleteAccount(acc.id)} className="ml-2 md:ml-4 text-on-surface/20 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 md:gap-10 p-6 md:p-10 bg-primary/[0.02] rounded-[2rem] md:rounded-[3rem] border border-primary/10 shadow-inner group/qr hover:bg-primary/[0.04] transition-all">
            <div className="p-4 md:p-6 bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-primary/5 border border-primary/5">
              <QrCode className="h-20 w-20 md:h-32 md:w-32 text-on-surface/10 group-hover/qr:text-primary/20 transition-colors" />
            </div>
            <div className="space-y-4 md:space-y-6 max-w-[200px]">
              <p className="text-[10px] md:text-[11px] font-bold text-on-surface/50 leading-relaxed uppercase tracking-tight">
                {t.qr_notice}
              </p>
              <button className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.2em] group/link">
                <span>{t.read_docs}</span>
                <ArrowRight className="h-4 w-4 group-hover/link:translate-x-3 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Automated Reminders Switch */}
      <section
        className="bg-white rounded-[1.5rem] md:rounded-[3rem] border border-primary/10 p-6 md:p-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer hover:shadow-xl hover:border-primary/30 transition-all relative overflow-hidden"
        onClick={() => setRemindersEnabled(!remindersEnabled)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="space-y-2 md:space-y-3 relative z-10">
          <h3 className="text-lg md:text-xl font-black text-on-surface uppercase tracking-tight">{t.auto_reminders}</h3>
          <p className="text-xs font-medium text-on-surface/40 max-w-md">{t.reminders_desc}</p>
        </div>
        <div className="flex items-center gap-4 md:gap-8 relative z-10">
          <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.4em]">{remindersEnabled ? t.on : t.off}</span>
          <div className={`h-8 md:h-10 w-14 md:w-18 rounded-full flex items-center px-1 transition-all duration-500 ${remindersEnabled ? 'bg-primary' : 'bg-on-surface/10'}`}>
            <motion.div
              animate={{ x: remindersEnabled ? 28 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="h-6 md:h-7 w-6 md:w-7 rounded-full bg-white shadow-lg flex items-center justify-center"
            >
              <div className={`h-1.5 w-1.5 rounded-full ${remindersEnabled ? 'bg-primary' : 'bg-on-surface/20'}`} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Message Templates */}
      <section className="space-y-6 md:space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 px-2 md:px-4">
          <div className="space-y-2">
            <h3 className="text-2xl md:text-3xl font-black text-on-surface tracking-tighter uppercase">{t.clinical_templates?.split(' ')[0]} <span className="text-primary italic font-serif lowercase">{t.clinical_templates?.split(' ').slice(1).join(' ')}</span></h3>
            <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.4em]">Proprietary Clinical Logic Modules</p>
          </div>
          <button className="text-[10px] font-black text-primary uppercase tracking-[0.3em] hover:tracking-[0.4em] transition-all flex items-center gap-2 group">
            {t.manage_templates} <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {[
            { id: 1, name: 'CONFIRMATION_REMINDER', text: t.template_conf_text },
            { id: 2, name: 'WAITLIST_OFFER', text: t.template_wait_text },
            { id: 3, name: 'POST_VISIT_FEEDBACK', text: t.template_feedback_text },
          ].map((item) => (
            <div key={item.id} className="bg-white rounded-[1.5rem] md:rounded-[3rem] border border-primary/10 p-6 md:p-10 flex flex-col gap-6 md:gap-10 group hover:shadow-2xl hover:border-primary/20 transition-all relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-primary/[0.02] rounded-full blur-[40px] group-hover:bg-primary/[0.05] transition-colors" />
              <div className="space-y-4 md:space-y-6 flex-1 relative z-10">
                <div className="flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                   <h4 className="text-[10px] font-black text-on-surface/60 uppercase tracking-[0.3em]">{item.name}</h4>
                </div>
                <p className="text-xs font-bold text-on-surface/40 leading-relaxed italic">
                  "{item.text}"
                </p>
              </div>
              <button className="w-full py-3 md:py-4 rounded-2xl bg-primary/[0.03] border border-primary/10 text-[9px] font-black uppercase tracking-[0.3em] hover:bg-primary hover:text-white hover:border-primary hover:scale-[1.05] transition-all active:scale-95 shadow-lg shadow-transparent hover:shadow-primary/20">
                {t.preview_logic}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
