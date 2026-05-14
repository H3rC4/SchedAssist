'use client';

import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Database, Server, Eye, FileCheck } from 'lucide-react';
import { useLandingTranslation } from '../LanguageContext';

export function LandingSecurity() {
  const { t } = useLandingTranslation();

  const securityFeatures = [
    { icon: Lock, titleKey: 'security_feature_ssl', descKey: 'security_feature_ssl_desc' },
    { icon: ShieldCheck, titleKey: 'security_feature_hipaa', descKey: 'security_feature_hipaa_desc' },
    { icon: Database, titleKey: 'security_feature_backup', descKey: 'security_feature_backup_desc' },
    { icon: Server, titleKey: 'security_feature_cloud', descKey: 'security_feature_cloud_desc' },
    { icon: Eye, titleKey: 'security_feature_access', descKey: 'security_feature_access_desc' },
    { icon: FileCheck, titleKey: 'security_feature_audit', descKey: 'security_feature_audit_desc' },
  ];

  return (
    <section className="relative py-32 bg-[#001f1c] px-6 overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-[#005c55]/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-[10px] font-black text-[#005c55] uppercase tracking-[0.4em] mb-4">
            {t.security_badge}
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase italic">
            {t.security_title} <span className="text-[#005c55]">{t.security_title_highlight}</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mt-4">
            {t.security_subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((feature, idx) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group"
            >
              <div className="h-full p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-[#005c55]/30 hover:bg-white/[0.07] transition-all duration-500">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity, delay: idx * 0.5 }}
                  className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:bg-[#005c55] transition-colors duration-500"
                >
                  <feature.icon className="h-7 w-7 text-white" />
                </motion.div>
                
                <h3 className="text-lg font-black text-white uppercase tracking-tighter italic mb-3">
                  {t[feature.titleKey as keyof typeof t]}
                </h3>
                <p className="text-sm text-white/60 font-medium leading-relaxed">
                  {t[feature.descKey as keyof typeof t]}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-20 flex flex-wrap items-center justify-center gap-8"
        >
          {['ISO 27001', 'HIPAA', 'GDPR', 'SOC 2'].map((badge) => (
            <div key={badge} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <ShieldCheck className="h-4 w-4 text-[#005c55]" />
              <span className="text-xs font-black text-white/70 uppercase tracking-widest">{badge}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
