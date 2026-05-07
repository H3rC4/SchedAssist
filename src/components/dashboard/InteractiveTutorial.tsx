'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, MessageSquareText, X, ArrowRight, CheckCircle2, Briefcase, Clock } from 'lucide-react';
import { translations, Language } from '@/lib/i18n';

interface TutorialProps {
  tenantId: string;
  lang?: Language;
  onComplete: () => void;
}

export function InteractiveTutorial({ tenantId, lang = 'es', onComplete }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const t = translations[lang] || translations['es'];
  
  const STEPS = [
    {
      id: 'tour-appointments',
      title: t.tutorial.step1_title,
      content: t.tutorial.step1_content,
      icon: CalendarDays,
      color: 'text-amber-500',
      bg: 'bg-amber-500'
    },
    {
      id: 'tour-whatsapp',
      title: t.tutorial.step2_title,
      content: t.tutorial.step2_content,
      icon: MessageSquareText,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500'
    },
    {
      id: 'tour-professionals',
      title: t.tutorial.step3_title,
      content: t.tutorial.step3_content,
      icon: Briefcase,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500'
    },
    {
      id: 'tour-professionals',
      title: t.tutorial.step4_title,
      content: t.tutorial.step4_content,
      icon: Clock,
      color: 'text-orange-500',
      bg: 'bg-orange-500'
    }
  ];

  useEffect(() => {
    setMounted(true);
    const timeout = setTimeout(updatePosition, 500);
    window.addEventListener('resize', updatePosition);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updatePosition);
    };
  }, [currentStep]);

  function updatePosition() {
    const el = document.getElementById(STEPS[currentStep]?.id);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    }
  }

  async function handleFinish() {
    try {
      await fetch('/api/tenant/tutorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId })
      });
    } catch (e) {
      console.error(e);
    }
    onComplete();
  }

  function nextStep() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(c => c + 1);
    } else {
      handleFinish();
    }
  }

  if (!mounted || !targetRect) return null;

  const stepInfo = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[150] pointer-events-auto">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] transition-all duration-500" />

      <div 
        className="absolute bg-transparent ring-[100vw] ring-[#191c1e]/40 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none rounded-none"
        style={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          boxShadow: `0 0 0 1px #005c55`
        }}
      >
        <div className="absolute inset-0 border-2 border-primary animate-pulse" />
      </div>

      <div 
        className="absolute z-[160] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-[360px] bg-white border border-primary/20 shadow-2xl overflow-hidden rounded-none"
        style={{
          top: targetRect.top > window.innerHeight / 2 ? undefined : targetRect.top,
          bottom: targetRect.top > window.innerHeight / 2 ? (window.innerHeight - targetRect.bottom) : undefined,
          left: targetRect.right + 32
        }}
      >
        <div className="h-1.5 w-full bg-primary/5">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="h-14 w-14 bg-primary/[0.03] border border-primary/10 flex items-center justify-center text-primary rounded-none">
              <stepInfo.icon className="h-6 w-6" />
            </div>
            <button 
              onClick={handleFinish}
              className="p-2 text-primary/40 hover:text-red-500 hover:bg-red-50 transition-colors rounded-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <h3 className="text-2xl font-black text-[#191c1e] tracking-tighter mb-3 uppercase italic leading-none">
            {stepInfo.title}
          </h3>
          <p className="text-[11px] text-[#191c1e]/60 leading-relaxed font-bold mb-8 uppercase tracking-tight">
            {stepInfo.content}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <span className="text-[10px] font-black text-primary/40 tracking-[0.3em] uppercase">
              STEP {currentStep + 1} / {STEPS.length}
            </span>
            <button
              onClick={nextStep}
              className="h-12 px-6 bg-primary text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-3 hover:bg-primary-light rounded-none"
            >
              {currentStep < STEPS.length - 1 ? (
                <><span>CONTINUE</span> <ArrowRight className="h-4 w-4" /></>
              ) : (
                <><span>FINISH TOUR</span> <CheckCircle2 className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
