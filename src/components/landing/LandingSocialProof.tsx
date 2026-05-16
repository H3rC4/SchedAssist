'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useLandingTranslation } from '../LanguageContext';

const testimonials = [
  {
    name: "Dra. María González",
    role: "Médica Clínica",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria&backgroundColor=e6f7f5",
    text: "Redujimos las faltas de pacientes en un 40% desde que implementamos confirmación por WhatsApp. La agenda se organizó sola.",
    rating: 5,
  },
  {
    name: "Dr. Juan Pérez",
    role: "Cardiólogo",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=juan&backgroundColor=e6f7f5",
    text: "Antes perdía 2 horas diarias llamando a pacientes. Ahora todo es automático y puedo enfocarme en lo que realmente importa.",
    rating: 5,
  },
  {
    name: "Dra. Ana López",
    role: "Pediatra",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ana&backgroundColor=e6f7f5",
    text: "La integración con historias clínicas nos permite tener todo en un solo lugar. El equipo médico está mucho más coordinado.",
    rating: 5,
  },
];

export function LandingSocialProof() {
  const { t } = useLandingTranslation();

  return (
    <section className="relative z-10 px-6 py-24 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[10px] font-black text-[#005c55] uppercase tracking-[0.4em] mb-4">
            {t.social_proof_badge}
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-[#191c1e] tracking-tight uppercase italic">
            {t.social_proof_title} <span className="text-[#005c55]">{t.social_proof_title_highlight}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group"
            >
              <div className="h-full bg-[#f7f9fb] rounded-2xl p-8 border border-[#005c55]/5 hover:border-[#005c55]/20 transition-all duration-500 relative">
                <Quote className="absolute top-6 right-6 h-6 w-6 text-[#005c55]/10" />
                
                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#005c55] text-[#005c55]" />
                  ))}
                </div>

                <p className="text-sm text-[#191c1e]/70 font-medium leading-relaxed mb-8 italic">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full bg-[#005c55]/5"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-sm font-black text-[#191c1e]">{testimonial.name}</p>
                    <p className="text-xs text-[#191c1e]/50 font-bold">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-[#005c55]/10 pt-12"
        >
          {[
            { value: '500+', label: t.stat_professionals },
            { value: '50K+', label: t.stat_appointments },
            { value: '98%', label: t.stat_confirmation },
            { value: '40%', label: t.stat_noshow_reduction },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-black text-[#005c55] tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.2em] mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
