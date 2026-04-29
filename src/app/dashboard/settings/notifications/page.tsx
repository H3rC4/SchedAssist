'use client';

import { Bell, Shield, Mail, Smartphone } from 'lucide-react';

export default function NotificationsSettingsPage() {
  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <header>
        <h1 className="text-4xl font-black text-on-surface tracking-tighter uppercase mb-2">
          Communication <span className="text-primary italic font-serif lowercase">Channels</span>
        </h1>
        <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.4em]">
          Notification Preferences & Alert Logic
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { icon: Mail, title: 'Email Notifications', desc: 'Daily activity reports and patient inquiries.' },
          { icon: Smartphone, title: 'Push Alerts', desc: 'Real-time appointment changes and waitlist updates.' },
          { icon: Shield, title: 'Security Alerts', desc: 'Login attempts and administrative changes.' },
          { icon: Bell, title: 'Patient Reminders', desc: 'Automated follow-ups for pending records.' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-[2.5rem] border border-on-surface/5 p-10 shadow-spatial flex flex-col gap-8 group hover:bg-on-surface/[0.01] transition-all">
            <div className="h-14 w-14 rounded-2xl bg-on-surface/[0.03] flex items-center justify-center text-on-surface/20 group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <item.icon className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-on-surface uppercase tracking-tight">{item.title}</h3>
              <p className="text-xs font-medium text-on-surface/40 leading-relaxed">{item.desc}</p>
            </div>
            <div className="flex items-center gap-4 mt-2">
               <div className="h-6 w-10 rounded-full bg-primary flex items-center px-1">
                 <div className="h-4 w-4 rounded-full bg-white translate-x-4 shadow-sm" />
               </div>
               <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
