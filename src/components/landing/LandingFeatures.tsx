'use client';

import { MessageCircle, BrainCircuit, BarChart3 } from 'lucide-react';
import Image from 'next/image';
import { useLandingTranslation } from '@/components/LanguageContext';

export function LandingFeatures() {
  const { t } = useLandingTranslation();

  const features = [
    {
      title: t.feature_1_title,
      desc: t.feature_1_desc,
      icon: MessageCircle,
      image: '/images/feature_whatsapp.png',
      color: 'bg-indigo-600 shadow-indigo-600/20'
    },
    {
      title: t.feature_2_title,
      desc: t.feature_2_desc,
      icon: BrainCircuit,
      image: '/images/feature_ai.png',
      color: 'bg-amber-500 shadow-amber-500/20 text-slate-900'
    },
    {
      title: t.feature_3_title,
      desc: t.feature_3_desc,
      icon: BarChart3,
      image: '/images/feature_dashboard.png',
      color: 'bg-emerald-600 shadow-emerald-600/20'
    }
  ];

  return (
    <section className="relative z-10 px-6 py-32 bg-white dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature, idx) => (
            <div key={idx} className="group relative">
              <div className="p-4 rounded-[3rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 h-full transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-900/5 hover:-translate-y-2">
                <div className="aspect-square relative rounded-[2.5rem] overflow-hidden mb-8 border border-slate-100 dark:border-slate-700">
                  <Image 
                    src={feature.image} 
                    alt={feature.title} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110" 
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                  />
                </div>
                <div className="px-6 pb-6">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${feature.color}`}>
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight uppercase italic">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
