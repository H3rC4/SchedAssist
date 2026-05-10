"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, ArrowRight, ArrowLeft, CheckCircle2,
  LayoutDashboard, Calendar, Users, Briefcase,
  Layers, MapPin, TrendingUp, Settings,
  UserPlus, Search, Info
} from "lucide-react"
import { translations, Language } from "@/lib/i18n"

interface GuidedTourProps {
  tenantId: string
  lang?: Language
  onComplete: () => void
}

interface GuideStep {
  id: string
  path: string
  skipNav?: boolean
}

const STEP_ICONS = [
  LayoutDashboard, Calendar, Users, Briefcase,
  UserPlus, Search, Briefcase, Info,
  Layers, MapPin, TrendingUp, Settings,
]

export function GuidedTour({ tenantId, lang = "es", onComplete }: GuidedTourProps) {
  const fullT = translations[lang] || translations["es"]
  const t = fullT.tour
  const router = useRouter()
  const pathname = usePathname()

  const [currentStep, setCurrentStep] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [tooltipSide, setTooltipSide] = useState<"right" | "left" | "center">("right")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevPathRef = useRef(pathname)

  const STEPS: GuideStep[] = [
    { id: "sidebar-dashboard", path: "/dashboard" },
    { id: "sidebar-appointments", path: "/dashboard" },
    { id: "sidebar-clients", path: "/dashboard" },
    { id: "sidebar-professionals", path: "/dashboard" },
    { id: "staff-add-btn", path: "/dashboard/professionals" },
    { id: "staff-search", path: "/dashboard/professionals" },
    { id: "staff-card", path: "/dashboard/professionals" },
    { id: "", path: "/dashboard/professionals", skipNav: true },
    { id: "sidebar-services", path: "/dashboard" },
    { id: "sidebar-locations", path: "/dashboard" },
    { id: "sidebar-analytics", path: "/dashboard" },
    { id: "sidebar-settings", path: "/dashboard" },
  ]

  const STEP_TITLES = [
    t.step_overview_title, t.step_schedule_title, t.step_patients_title,
    t.step_staff_title, t.step_add_professional_title, t.step_search_title,
    t.step_card_title, t.step_drawer_info_title, t.step_services_title,
    t.step_locations_title, t.step_analytics_title, t.step_settings_title,
  ]

  const STEP_CONTENTS = [
    t.step_overview_content, t.step_schedule_content, t.step_patients_content,
    t.step_staff_content, t.step_add_professional_content, t.step_search_content,
    t.step_card_content, t.step_drawer_info_content, t.step_services_content,
    t.step_locations_content, t.step_analytics_content, t.step_settings_content,
  ]

  const step = STEPS[currentStep]
  const isInfoStep = step.skipNav || !step.id

  const findTarget = useCallback(() => {
    if (isInfoStep) {
      setTargetRect(null)
      setTooltipSide("center")
      return
    }
    const el = document.querySelector(`[data-tour="${step.id}"]`)
    if (el) {
      const rect = el.getBoundingClientRect()
      setTargetRect(rect)
      const tooltipW = 380
      const gap = 24
      if (rect.right + tooltipW + gap < window.innerWidth) {
        setTooltipSide("right")
      } else if (rect.left - tooltipW - gap > 0) {
        setTooltipSide("left")
      } else {
        setTooltipSide("center")
      }
    } else {
      setTargetRect(null)
    }
  }, [step.id, isInfoStep])

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const expectedPath = step.path
    const currentPath = pathname

    if (currentPath !== expectedPath) {
      setIsNavigating(true)
      setTargetRect(null)
      router.push(expectedPath)
      return
    }

    if (currentPath === prevPathRef.current && !isNavigating) {
      findTarget()
    }

    if (isNavigating && currentPath === expectedPath) {
      setIsNavigating(false)
      const timeout = setTimeout(() => {
        findTarget()
      }, 600)
      return () => clearTimeout(timeout)
    }

    prevPathRef.current = currentPath
  }, [currentStep, pathname, mounted])

  useEffect(() => {
    if (isNavigating) return
    if (isInfoStep) {
      setTargetRect(null)
      return
    }

    if (targetRect) return

    findTarget()

    pollRef.current = setInterval(() => {
      const el = document.querySelector(`[data-tour="${step.id}"]`)
      if (el) {
        findTarget()
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = null
      }
    }, 300)

    const timeout = setTimeout(() => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }, 5000)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      clearTimeout(timeout)
    }
  }, [currentStep, pathname, isNavigating, isInfoStep, step.id])

  useEffect(() => {
    function onResize() {
      if (!isInfoStep) findTarget()
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [findTarget, isInfoStep])

  async function handleFinish() {
    try {
      await fetch("/api/tenant/tutorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId }),
      })
    } catch (e) {
      console.error(e)
    }
    onComplete()
  }

  function nextStep() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((c) => c + 1)
    } else {
      handleFinish()
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      const prev = STEPS[currentStep - 1]
      setCurrentStep((c) => c - 1)
      if (prev.path !== pathname) {
        router.push(prev.path)
        setIsNavigating(true)
      }
    }
  }

  if (!mounted) return null

  const showSpotlight = targetRect && !isInfoStep
  const IconComponent = STEP_ICONS[currentStep] || Info

  function getTooltipStyle(): React.CSSProperties {
    if (isInfoStep || !targetRect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }
    }

    const tooltipW = 380
    const TOOLTIP_H = 350
    const gap = 24
    const rect = targetRect
    const maxTop = window.innerHeight - TOOLTIP_H - 16

    if (tooltipSide === "right") {
      return {
        top: Math.min(Math.max(16, rect.top), maxTop),
        left: rect.right + gap,
      }
    }
    if (tooltipSide === "left") {
      return {
        top: Math.min(Math.max(16, rect.top), maxTop),
        left: rect.left - tooltipW - gap,
      }
    }
    return {
      top: Math.min(Math.max(16, rect.bottom + gap), maxTop),
      left: Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipW / 2, window.innerWidth - tooltipW - 16)),
    }
  }

  const tooltipStyle = getTooltipStyle()

  return createPortal(
    <div className="fixed inset-0 z-[150] pointer-events-auto">
      <div className="absolute inset-0 bg-black/25 transition-all duration-500" />

      {showSpotlight && targetRect && (
        <div
          className="absolute bg-transparent ring-[100vw] ring-black/25 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            boxShadow: "0 0 0 2px #005c55",
          }}
        >
          <div className="absolute inset-0 border-2 border-primary animate-pulse rounded-[inherit]" />
        </div>
      )}

      {isNavigating ? (
        <div className="absolute inset-0 flex items-center justify-center z-[160]">
          <div className="h-16 w-16 border-[4px] border-white/10 border-t-white animate-spin rounded-full" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute z-[160] w-[380px] max-w-[calc(100vw-32px)] bg-white border border-primary/10 shadow-modal overflow-hidden"
            style={tooltipStyle}
          >
            <div className="h-1.5 w-full bg-primary/5">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>

            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="h-12 w-12 bg-primary/[0.03] border border-primary/10 flex items-center justify-center text-primary shrink-0">
                  <IconComponent className="h-5 w-5" />
                </div>
                <button
                  onClick={handleFinish}
                  className="p-2 text-primary/30 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <h3 className="text-xl font-black text-[#191c1e] tracking-tighter uppercase mb-3">
                {STEP_TITLES[currentStep]}
              </h3>
              <p className="text-[11px] text-[#191c1e]/60 leading-relaxed font-bold mb-8">
                {STEP_CONTENTS[currentStep]}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-primary/40 tracking-[0.3em] uppercase">
                    {t.step_label(currentStep + 1, STEPS.length)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <button
                      onClick={prevStep}
                      className="h-10 px-4 text-[10px] font-black text-primary/60 uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      {t.back}
                    </button>
                  )}
                  {currentStep < STEPS.length - 1 ? (
                    <button
                      onClick={nextStep}
                      className="h-10 px-5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 hover:bg-primary-light"
                    >
                      <span>{t.next}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleFinish}
                      className="h-10 px-5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 hover:bg-primary-light"
                    >
                      <span>{t.finish}</span>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {!isNavigating && (
        <button
          onClick={handleFinish}
          className="absolute bottom-6 right-6 z-[160] px-5 py-3 text-[9px] font-black text-white/60 uppercase tracking-[0.3em] hover:text-white transition-colors bg-black/30 hover:bg-black/50"
        >
          {t.skip}
        </button>
      )}
    </div>,
    document.body
  )
}
