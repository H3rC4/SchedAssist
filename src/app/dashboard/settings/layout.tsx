'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Smartphone, Bell, CreditCard, ChevronRight, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import { translations, Language } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [lang, setLang] = useState<Language>('es');
  
  useEffect(() => {
    async function loadLang() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('tenant_users')
        .select('tenants(settings)')
        .eq('user_id', user.id)
        .single();
      
      if (data?.tenants) {
        setLang(((data.tenants as any).settings?.language as Language) || 'es');
      }
    }
    loadLang();
  }, []);

  const t = (translations[lang] || translations['es']) as any;

  const menuItems = [
    { id: 'general', label: t.general || 'General', icon: Settings, href: '/dashboard/settings' },
    { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone, href: '/dashboard/settings/whatsapp' },
    { id: 'notifications', label: t.notifications || 'Notifications', icon: Bell, href: '/dashboard/settings/notifications' },
    { id: 'billing', label: t.billing || 'Billing', icon: CreditCard, href: '/dashboard/settings/billing' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-full bg-surface-container-lowest rounded-[1.5rem] md:rounded-[3rem] overflow-hidden border border-on-surface/5 shadow-spatial">
      {/* Settings Secondary Sidebar */}
      <aside className="w-full md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-on-surface/5 bg-white p-4 md:p-8 lg:p-10 flex flex-row md:flex-col gap-4 md:gap-12 flex-shrink-0 overflow-x-auto md:overflow-visible">
        <div className="min-w-0 flex-1 md:flex-none">
          <h2 className="hidden md:block text-[10px] font-black text-on-surface/30 uppercase tracking-[0.4em] mb-6 lg:mb-8 px-4">
            {t.preferences}
          </h2>
          <nav className="flex md:flex-col gap-2 md:gap-3">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (item.id === 'general' && pathname === '/dashboard/settings');
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-2 md:gap-4 px-4 md:px-6 py-2.5 md:py-4 rounded-xl md:rounded-[1.5rem] transition-all group relative overflow-hidden whitespace-nowrap flex-shrink-0
                    ${isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-on-surface/40 hover:bg-on-surface/5 hover:text-on-surface'}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-settings-tab"
                      className="absolute inset-0 bg-primary -z-10"
                    />
                  )}
                  <item.icon className={`h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-on-surface/40 group-hover:text-primary'}`} />
                  <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System Info / Status */}
        <div className="hidden md:block mt-auto p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] bg-on-surface/5 border border-on-surface/5">
          <div className="flex items-center gap-3 mb-4">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">{t.cloud_sync_active}</span>
          </div>
          <p className="text-[9px] font-bold text-on-surface/30 leading-relaxed uppercase tracking-tighter">
            V.2.4.0 <br />
            {t.last_backup('Today, 04:12 AM')}
          </p>
        </div>
      </aside>

      {/* Settings Content Area */}
      <main className="flex-1 overflow-y-auto bg-white/50 backdrop-blur-md custom-scrollbar p-4 md:p-12 lg:p-20">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
