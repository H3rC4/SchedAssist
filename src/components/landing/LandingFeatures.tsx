'use client';

import { motion } from 'framer-motion';
import { MessageCircle, BrainCircuit, BarChart3, CreditCard, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { useLandingTranslation } from '@/components/LanguageContext';
import { TiltCard } from './Animations';
import { DashboardPreview } from './previews/DashboardPreview';
import { CalendarPreview } from './previews/CalendarPreview';
import { WhatsAppPreview } from './previews/WhatsAppPreview';
import { ClinicalRecordPreview } from './previews/ClinicalRecordPreview';
import { PaymentsPreview } from './previews/PaymentsPreview';
import { BarChart2 } from 'lucide-react';

interface FeatureData {
  title: string;
  desc: string;
  icon: React.ElementType;
  preview: React.ReactNode;
  className: string;
}

export function LandingFeatures() {
  const { t } = useLandingTranslation();

  const features: FeatureData[] = [
    {
      title: 'Agenda Inteligente',
      desc: 'Vista semanal con todos los turnos organizados por profesional. Colores por estado y arrastre para reprogramar.',
      icon: BarChart3,
      preview: <CalendarPreview />,
      className: 'md:col-span-8',
    },
    {
      title: 'WhatsApp AI',
      desc: 'Confirmaciones automáticas, recordatorios y cancelaciones vía WhatsApp sin intervención humana.',
      icon: MessageCircle,
      preview: <WhatsAppPreview />,
      className: 'md:col-span-4',
    },
    {
      title: 'Dashboard Analytics',
      desc: 'Métricas en tiempo real: turnos, pacientes, ingresos y tasas de cumplimiento.',
      icon: BarChart2,
      preview: <DashboardPreview />,
      className: 'md:col-span-4',
    },
    {
      title: 'Pagos Integrados',
      desc: 'Cobros automáticos vía Stripe. Tarjetas de crédito, débito y transferencias.',
      icon: CreditCard,
      preview: <PaymentsPreview />,
      className: 'md:col-span-4',
    },
    {
      title: 'Historias Clínicas',
      desc: 'Registro completo de cada paciente con diagnósticos, prescripciones y notas médicas.',
      icon: BrainCircuit,
      preview: <ClinicalRecordPreview />,
      className: 'md:col-span-4',
    },
  ];

  return (
    <section id="features" className="relative z-10 px-6 py-24 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#005c55]/10 bg-[#005c55]/[0.03] text-[#005c55] text-[9px] font-black uppercase tracking-[0.2em] mb-6">
            <Sparkles className="h-3 w-3" /> {t.features_badge}
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#191c1e] tracking-tight uppercase italic">
            {t.features_title}
          </h2>
          <p className="text-[#191c1e]/60 font-medium max-w-2xl mx-auto mt-4">
            {t.features_subtitle}
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 md:grid-flow-dense gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className={feature.className}
            >
              <TiltCard className="h-full">
                <div className="h-full bg-[#f7f9fb] border border-[#005c55]/5 hover:border-[#005c55]/20 transition-all duration-500 relative overflow-hidden rounded-[2rem] p-8 group">
                  <div className="absolute top-0 right-0 h-32 w-32 bg-[#005c55]/[0.04] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center mb-6 group-hover:bg-[#005c55] group-hover:text-white transition-all duration-500 shadow-lg">
                    <feature.icon className="h-6 w-6 text-[#005c55] group-hover:text-white" />
                  </div>
                  
                  <h3 className="text-xl font-black text-[#191c1e] mb-3 tracking-tight group-hover:text-[#005c55] transition-colors uppercase italic">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#191c1e]/50 leading-relaxed font-medium mb-6">
                    {feature.desc}
                  </p>

                  {feature.preview && (
                    <div className="relative rounded-xl overflow-hidden shadow-lg border border-[#005c55]/5">
                      <div className="transform scale-[0.95] origin-top">
                        {feature.preview}
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 noise opacity-[0.02] pointer-events-none" />
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
