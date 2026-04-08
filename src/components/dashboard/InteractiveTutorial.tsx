'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, MessageSquareText, X, ArrowRight, CheckCircle2 } from 'lucide-react';

interface TutorialProps {
  tenantId: string;
  onComplete: () => void;
}

const STEPS = [
  {
    id: 'tour-appointments',
    title: '¡Aquí es tu Base!',
    content: 'En esta pestaña podrás ver los turnos del día, revisar la disponibilidad de tus doctores y agendar citas manualmente.',
    icon: CalendarDays,
    color: 'text-amber-500',
    bg: 'bg-amber-500'
  },
  {
    id: 'tour-whatsapp',
    title: 'El Súper Poder 🤖',
    content: 'Aquí es donde conectas tu número de WhatsApp para que nuestro agente de IA agende citas por ti 24/7 sin que muevas un dedo.',
    icon: MessageSquareText,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500'
  }
];

export function InteractiveTutorial({ tenantId, onComplete }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setMounted(true);
    // Un pequeño retraso para asegurar que el sidebar esté renderizado
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
    // API call para marcar tutorial como completado
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
      
      {/* Fondo oscuro general que ignora clicks */}
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px] transition-all duration-500" 
      />

      {/* Recorte (Spotlight) en el elemento objetivo */}
      <div 
        className="absolute bg-transparent ring-[100vw] ring-slate-900/40 dark:ring-black/60 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none rounded-[1.5rem]"
        style={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          boxShadow: `0 0 0 4px ${stepInfo.bg.replace('bg-', '') === 'amber-500' ? '#f59e0b' : '#10b981'}`
        }}
      >
        <div className="absolute inset-0 border-2 border-white/20 rounded-[1.5rem] animate-pulse" />
      </div>

      {/* Caja del Tooltip */}
      <div 
        className="absolute z-[160] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-[320px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
        style={{
          top: targetRect.top,
          // Colocar el tooltip a la derecha del enlace del sidebar
          left: targetRect.right + 24
        }}
      >
        {/* Progress Bar Top */}
        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
          <div 
            className={`h-full ${stepInfo.bg} transition-all duration-500`}
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${stepInfo.bg}/10`}>
              <stepInfo.icon className={`h-6 w-6 ${stepInfo.color}`} />
            </div>
            <button 
              onClick={handleFinish}
              className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            {stepInfo.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-6">
            {stepInfo.content}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
              Paso {currentStep + 1} de {STEPS.length}
            </span>
            <button
              onClick={nextStep}
              className={`h-10 px-5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center gap-2 ${stepInfo.bg} hover:opacity-90`}
            >
              {currentStep < STEPS.length - 1 ? (
                <>Siguiente <ArrowRight className="h-4 w-4" /></>
              ) : (
                <>Entendido <CheckCircle2 className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
