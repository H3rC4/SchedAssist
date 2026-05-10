'use client';

import { useEffect, useState } from 'react';
import { Smartphone, CheckCircle2, Zap, Loader2, QrCode, Plus, MessageSquare, Trash2, ArrowRight, X, AlertCircle, ArrowUpRight } from 'lucide-react';
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
    <div className="space-y-16 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter uppercase mb-2">
            WhatsApp <span className="text-primary italic font-serif lowercase">{t.integration || 'Integration'}</span>
          </h1>
          <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.4em]">
            {t.whapi_desc || 'Automated Patient Communication Gateway'}
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-8 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg hover:-translate-y-1 transition-all active:scale-95"
        >
          {showAddForm ? t.cancel || 'Cancel' : t.add_account || 'Add New Account'}
        </button>
      </header>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.section 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[2.5rem] border border-primary/20 p-10 shadow-spatial space-y-8">
              <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">{t.connect_business || 'Connect Business Account'}</h3>
              <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">{t.account_label || 'Account Label'}</label>
                   <input 
                     type="text" 
                     value={newAccount.label}
                     onChange={e => setNewAccount({...newAccount, label: e.target.value})}
                     className="w-full h-14 bg-on-surface/[0.03] rounded-2xl border-2 border-transparent px-6 font-bold text-on-surface focus:bg-white focus:border-primary transition-all outline-none"
                     placeholder="e.g. Main Clinic WhatsApp"
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">{t.phone_id_label || 'Phone Number ID'}</label>
                   <input 
                     type="text" 
                     value={newAccount.phone_number_id}
                     onChange={e => setNewAccount({...newAccount, phone_number_id: e.target.value})}
                     className="w-full h-14 bg-on-surface/[0.03] rounded-2xl border-2 border-transparent px-6 font-bold text-on-surface focus:bg-white focus:border-primary transition-all outline-none"
                   />
                </div>
                <div className="md:col-span-2 space-y-3">
                   <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">{t.token_label || 'Access Token'}</label>
                   <input 
                     type="password" 
                     value={newAccount.access_token}
                     onChange={e => setNewAccount({...newAccount, access_token: e.target.value})}
                     className="w-full h-14 bg-on-surface/[0.03] rounded-2xl border-2 border-transparent px-6 font-bold text-on-surface focus:bg-white focus:border-primary transition-all outline-none"
                   />
                </div>
                {formError && (
                  <div className="md:col-span-2 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> {formError}
                  </div>
                )}
                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="md:col-span-2 h-16 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                >
                  {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : t.confirm_integration || 'Confirm Integration'}
                </button>
              </form>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

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

      {/* Integration Status Card */}
      <section className="bg-white rounded-[2.5rem] border border-on-surface/5 p-10 md:p-12 shadow-spatial">
        <div className="flex flex-col md:flex-row items-start justify-between gap-12">
          <div className="space-y-8 flex-1">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">
                {t.integration_status || 'Integration Status'}
              </h3>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  isConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  <CheckCircle2 className={`h-3 w-3 ${isConnected ? '' : 'animate-pulse'}`} />
                  {isConnected ? t.active_instance || 'Active Instance' : t.link_required || 'Link Required'}
                </div>
              </div>
            </div>
            
            <p className="text-sm font-medium text-on-surface/50 leading-relaxed max-w-sm">
              {isConnected 
                ? t.whatsapp_active_desc || 'Your primary account is linked. Automated reminders and clinical follow-ups are active.' 
                : t.whatsapp_inactive_desc || 'Connect your WhatsApp Business API account to enable automated reminders.'}
            </p>

            <div className="flex flex-wrap gap-4">
              {accounts.map(acc => (
                <div key={acc.id} className="flex items-center gap-3 bg-on-surface/[0.03] px-6 py-3 rounded-2xl border border-on-surface/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface/60">{acc.label}</span>
                  <button onClick={() => handleDeleteAccount(acc.id)} className="text-on-surface/20 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-8 p-8 bg-on-surface/[0.02] rounded-[2rem] border border-on-surface/5">
            <div className="p-4 bg-white rounded-2xl shadow-sm">
              <QrCode className="h-24 w-24 text-on-surface/20" />
            </div>
            <div className="space-y-4 max-w-[180px]">
              <p className="text-[11px] font-bold text-on-surface/60 leading-tight">
                {t.qr_notice || 'Business accounts require API configuration. Standard QR pairing is for personal instances.'}
              </p>
              <button className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:translate-x-2 transition-transform">
                {t.read_docs || 'Read Documentation'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Automated Reminders Switch */}
      <section className="bg-white rounded-[2rem] border border-on-surface/5 p-8 md:p-10 flex items-center justify-between group cursor-pointer hover:shadow-lg transition-all" onClick={() => setRemindersEnabled(!remindersEnabled)}>
        <div className="space-y-2">
          <h3 className="text-lg font-black text-on-surface uppercase tracking-tight">{t.auto_reminders || 'Automated Reminders'}</h3>
          <p className="text-xs font-medium text-on-surface/40">{t.reminders_desc || 'Send automatic confirmations 24 hours before scheduled visits.'}</p>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">{remindersEnabled ? t.on || 'On' : t.off || 'Off'}</span>
          <div className={`h-8 w-14 rounded-full flex items-center px-1 transition-all ${remindersEnabled ? 'bg-primary' : 'bg-on-surface/10'}`}>
            <motion.div 
              animate={{ x: remindersEnabled ? 24 : 0 }}
              className="h-6 w-6 rounded-full bg-white shadow-md" 
            />
          </div>
        </div>
      </section>

      {/* Message Templates */}
      <section className="space-y-8">
        <div className="flex items-end justify-between px-2">
          <h3 className="text-2xl font-black text-on-surface tracking-tighter uppercase">{t.clinical_templates || 'Clinical Templates'}</h3>
          <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
            {t.manage_templates || 'Manage Cloud API Templates'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: 1, name: 'CONFIRMATION_REMINDER', text: t.template_conf_text || 'Hi [Patient], your visit is confirmed for [Date] at [Time]. Please confirm attendance.' },
            { id: 2, name: 'WAITLIST_OFFER', text: t.template_wait_text || 'Good news! A slot opened for today at [Time]. Would you like to take it?' },
            { id: 3, name: 'POST_VISIT_FEEDBACK', text: t.template_feedback_text || 'Thank you for visiting [Clinic]. Please rate your experience: [Link]' },
          ].map((item) => (
            <div key={item.id} className="bg-white rounded-[2rem] border border-on-surface/5 p-8 flex flex-col gap-6 group hover:shadow-xl transition-all">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-500" />
                   <h4 className="text-[10px] font-black text-on-surface uppercase tracking-widest">{item.name}</h4>
                </div>
                <p className="text-xs font-medium text-on-surface/40 leading-relaxed italic">
                  "{item.text}"
                </p>
              </div>
              <button className="w-full py-3 rounded-xl border border-on-surface/5 text-[9px] font-black uppercase tracking-widest hover:bg-on-surface/5 transition-all">
                {t.preview_logic || 'Preview Logic'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
