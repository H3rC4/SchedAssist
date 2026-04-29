'use client';

import { useEffect, useState } from 'react';
import { Smartphone, CheckCircle2, Zap, Loader2, QrCode, Plus, MessageSquare, Trash2, ArrowRight, X, AlertCircle } from 'lucide-react';
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
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ label: '', phone_number_id: '', access_token: '' });
  const [formError, setFormError] = useState('');

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
            WhatsApp <span className="text-primary italic font-serif lowercase">Configuration</span>
          </h1>
          <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.4em]">
            Automated Patient Communication Gateway
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-8 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg hover:-translate-y-1 transition-all active:scale-95"
        >
          {showAddForm ? 'Cancel' : 'Add New Account'}
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
              <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">Connect Business Account</h3>
              <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">Account Label</label>
                   <input 
                     type="text" 
                     value={newAccount.label}
                     onChange={e => setNewAccount({...newAccount, label: e.target.value})}
                     className="w-full h-14 bg-on-surface/[0.03] rounded-2xl border-2 border-transparent px-6 font-bold text-on-surface focus:bg-white focus:border-primary transition-all outline-none"
                     placeholder="e.g. Main Clinic WhatsApp"
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">Phone Number ID</label>
                   <input 
                     type="text" 
                     value={newAccount.phone_number_id}
                     onChange={e => setNewAccount({...newAccount, phone_number_id: e.target.value})}
                     className="w-full h-14 bg-on-surface/[0.03] rounded-2xl border-2 border-transparent px-6 font-bold text-on-surface focus:bg-white focus:border-primary transition-all outline-none"
                   />
                </div>
                <div className="md:col-span-2 space-y-3">
                   <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">Access Token</label>
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
                  {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Confirm Integration'}
                </button>
              </form>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Integration Status Card */}
      <section className="bg-white rounded-[2.5rem] border border-on-surface/5 p-10 md:p-12 shadow-spatial">
        <div className="flex flex-col md:flex-row items-start justify-between gap-12">
          <div className="space-y-8 flex-1">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">
                Integration Status
              </h3>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  isConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  <CheckCircle2 className={`h-3 w-3 ${isConnected ? '' : 'animate-pulse'}`} />
                  {isConnected ? 'Active Instance' : 'Link Required'}
                </div>
              </div>
            </div>
            
            <p className="text-sm font-medium text-on-surface/50 leading-relaxed max-w-sm">
              {isConnected 
                ? 'Your primary account is linked. Automated reminders and clinical follow-ups are active.' 
                : 'Connect your WhatsApp Business API account to enable automated reminders and sequential waitlist notifications.'}
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
                Business accounts require API configuration. Standard QR pairing is for personal instances.
              </p>
              <button className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:translate-x-2 transition-transform">
                Read Documentation <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Automated Reminders Switch */}
      <section className="bg-white rounded-[2rem] border border-on-surface/5 p-8 md:p-10 flex items-center justify-between group cursor-pointer hover:shadow-lg transition-all" onClick={() => setRemindersEnabled(!remindersEnabled)}>
        <div className="space-y-2">
          <h3 className="text-lg font-black text-on-surface uppercase tracking-tight">Automated Reminders</h3>
          <p className="text-xs font-medium text-on-surface/40">Send automatic confirmations 24 hours before scheduled visits.</p>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">{remindersEnabled ? 'On' : 'Off'}</span>
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
          <h3 className="text-2xl font-black text-on-surface tracking-tighter uppercase">Clinical Templates</h3>
          <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
            Manage Cloud API Templates
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: 1, name: 'CONFIRMATION_REMINDER', text: 'Hi [Patient], your visit is confirmed for [Date] at [Time]. Please confirm attendance.' },
            { id: 2, name: 'WAITLIST_OFFER', text: 'Good news! A slot opened for today at [Time]. Would you like to take it? (Reply in [X] min)' },
            { id: 3, name: 'POST_VISIT_FEEDBACK', text: 'Thank you for visiting [Clinic]. Please rate your experience: [Link]' },
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
                Preview Logic
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
