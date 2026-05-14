'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Stethoscope, CalendarPlus, MessageCircle, ClipboardCheck, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { useLandingTranslation } from '../LanguageContext';

const steps = [
  { number: '01', icon: Stethoscope },
  { number: '02', icon: CalendarPlus },
  { number: '03', icon: MessageCircle },
  { number: '04', icon: ClipboardCheck },
];

export function LandingHowItWorks() {
  const { t } = useLandingTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const lineWidth = useTransform(scrollYProgress, [0.1, 0.6], ["0%", "100%"]);

  return (
    <section ref={containerRef} className="relative z-10 px-6 py-32 bg-[#f7f9fb] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-[10px] font-black text-[#005c55] uppercase tracking-[0.4em] mb-4">
            {t.howitworks_badge}
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-[#191c1e] tracking-tight uppercase italic">
            {t.howitworks_title} <span className="text-[#005c55]">{t.howitworks_title_highlight}</span>
          </h2>
          <p className="text-lg text-[#191c1e]/60 font-medium max-w-2xl mx-auto mt-4">
            {t.howitworks_subtitle}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Progress line - desktop */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-[#005c55]/10">
            <motion.div 
              className="h-full bg-[#005c55]"
              style={{ width: lineWidth }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="relative"
              >
                <div className="text-center">
                  {/* Number */}
                  <div className="relative inline-block mb-6">
                    <span className="text-6xl font-black text-[#005c55]/[0.06] absolute -top-4 left-1/2 -translate-x-1/2">
                      {step.number}
                    </span>
                    <div className="relative h-16 w-16 mx-auto rounded-2xl bg-white border border-[#005c55]/10 flex items-center justify-center shadow-lg shadow-[#005c55]/5 group-hover:border-[#005c55]/30 transition-all">
                      <step.icon className="h-7 w-7 text-[#005c55]" />
                    </div>
                  </div>

                  {/* Connector dot - desktop */}
                  <div className="hidden md:block absolute top-24 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-[#f7f9fb] border-2 border-[#005c55]/20 z-10">
                    <motion.div 
                      className="h-full w-full rounded-full bg-[#005c55]"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.15 + 0.3 }}
                    />
                  </div>

                  <h3 className="text-lg font-black text-[#191c1e] uppercase tracking-tighter italic mb-3 mt-8">
                    {t[`howitworks_step${idx + 1}_title` as keyof typeof t]}
                  </h3>
                  <p className="text-sm text-[#191c1e]/60 font-medium leading-relaxed max-w-xs mx-auto">
                    {t[`howitworks_step${idx + 1}_desc` as keyof typeof t]}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
