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
    <div className="flex h-full bg-surface-container-lowest rounded-[3rem] overflow-hidden border border-on-surface/5 shadow-spatial">
      {/* Settings Secondary Sidebar */}
      <aside className="w-80 border-r border-on-surface/5 bg-white p-10 flex flex-col gap-12 flex-shrink-0">
        <div>
          <h2 className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.4em] mb-8 px-4">
            Preferences
          </h2>
          <nav className="space-y-3">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (item.id === 'general' && pathname === '/dashboard/settings');
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all group relative overflow-hidden
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
                  <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-on-surface/40 group-hover:text-primary'}`} />
                  <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System Info / Status */}
        <div className="mt-auto p-8 rounded-[2rem] bg-on-surface/5 border border-on-surface/5">
          <div className="flex items-center gap-3 mb-4">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Cloud Sync Active</span>
          </div>
          <p className="text-[9px] font-bold text-on-surface/30 leading-relaxed uppercase tracking-tighter">
            V.2.4.0 <br />
            Last encrypted backup: Today, 04:12 AM
          </p>
        </div>
      </aside>

      {/* Settings Content Area */}
      <main className="flex-1 overflow-y-auto bg-white/50 backdrop-blur-md custom-scrollbar p-12 md:p-20 lg:p-24">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
