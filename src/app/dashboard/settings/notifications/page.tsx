'use client';

import { useEffect, useState } from 'react';
import { Bell, Shield, Mail, Smartphone, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { translations, Language } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationsSettingsPage() {
  const [lang, setLang] = useState<Language>('es');
  const [tenantId, setTenantId] = useState('');
  const [settings, setSettings] = useState<any>({
    email_notifications: true,
    push_alerts: true,
    security_alerts: true,
    patient_reminders: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const t = (translations[lang] || translations['es']) as any;

  useEffect(() => {
    async function fetchSettings() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('tenant_users')
        .select('tenant_id, tenants(settings)')
        .eq('user_id', user.id)
        .single();

      if (data?.tenants) {
        const tenant = data.tenants as any;
        setTenantId(data.tenant_id);
        const s = tenant.settings || {};
        setLang(s.language || 'es');
        
        // Initialize notifications from settings or defaults
        const notifications = s.notifications || {
          email_notifications: true,
          push_alerts: true,
          security_alerts: true,
          patient_reminders: true
        };
        setSettings(notifications);
      }
      setIsLoading(false);
    }
    fetchSettings();
  }, []);

  const toggleSetting = async (key: string) => {
    setIsUpdating(key);
    const newValue = !settings[key];
    const newNotifications = { ...settings, [key]: newValue };
    
    const supabase = createClient();
    
    // First get current full settings to avoid overwriting other keys
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenantId)
      .single();
    
    const currentSettings = tenantData?.settings || {};
    const updatedSettings = {
      ...currentSettings,
      notifications: newNotifications
    };

    const { error } = await supabase
      .from('tenants')
      .update({ settings: updatedSettings })
      .eq('id', tenantId);

    if (!error) {
      setSettings(newNotifications);
    }
    setIsUpdating(null);
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
      </div>
    );
  }

  const notificationItems = [
    { id: 'email_notifications', icon: Mail, title: t.email_notifications, desc: t.email_notifications_desc },
    { id: 'push_alerts', icon: Smartphone, title: t.push_alerts, desc: t.push_alerts_desc },
    { id: 'security_alerts', icon: Shield, title: t.security_alerts, desc: t.security_alerts_desc },
    { id: 'patient_reminders', icon: Bell, title: t.patient_reminders, desc: t.patient_reminders_desc },
  ];

  return (
    <div className="space-y-10 md:space-y-16 animate-in fade-in duration-700">
      <header>
        <h1 className="text-2xl md:text-4xl font-black text-on-surface tracking-tighter uppercase mb-2">
          {t.comm_channels?.split(' ')[0]} <span className="text-primary italic font-serif lowercase">{t.comm_channels?.split(' ').slice(1).join(' ')}</span>
        </h1>
        <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.4em]">
          {t.comm_channels_desc}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {notificationItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-on-surface/5 p-6 md:p-10 shadow-spatial flex flex-col gap-6 md:gap-8 group transition-all relative overflow-hidden
              ${settings[item.id] ? 'hover:bg-primary/[0.02]' : 'hover:bg-on-surface/[0.01]'}
            `}
          >
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-on-surface/[0.03] flex items-center justify-center text-on-surface/20 group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <item.icon className="h-5 w-5 md:h-6 md:w-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base md:text-lg font-black text-on-surface uppercase tracking-tight">{item.title}</h3>
              <p className="text-xs font-medium text-on-surface/40 leading-relaxed">{item.desc}</p>
            </div>

            <div className="flex items-center justify-between mt-auto pt-4">
               <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleSetting(item.id)}
                    disabled={isUpdating === item.id}
                    className={`h-7 w-12 rounded-full flex items-center px-1 transition-all relative
                      ${settings[item.id] ? 'bg-primary' : 'bg-on-surface/10'}
                      ${isUpdating === item.id ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:scale-105 active:scale-95'}
                    `}
                  >
                    <motion.div
                      layout
                      className="h-5 w-5 rounded-full bg-white shadow-sm"
                      animate={{ x: settings[item.id] ? 20 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${settings[item.id] ? 'text-primary' : 'text-on-surface/30'}`}>
                    {settings[item.id] ? (t.active_status || 'Active') : (t.inactive_status || 'Inactive')}
                  </span>
               </div>

               <AnimatePresence>
                 {isUpdating === item.id && (
                   <motion.div
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     className="text-primary"
                   >
                     <Loader2 className="h-4 w-4 animate-spin" />
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
