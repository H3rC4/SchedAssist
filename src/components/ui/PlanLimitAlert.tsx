"use client"

import { motion } from 'framer-motion'
import { AlertCircle, ChevronRight, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

interface PlanLimitAlertProps {
  lang: 'en' | 'es' | 'it'
  translations: {
    limit_reached_title: string
    limit_reached_description: string
    limit_reached_upgrade_cta: string
  }
  resource: string
  current: number
  max: number
}

export function PlanLimitAlert({
  lang,
  translations: t,
  resource,
  current,
  max,
}: PlanLimitAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4"
    >
      <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
        <ShieldAlert className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-amber-800 mb-1">
          {t.limit_reached_title}
        </p>
        <p className="text-xs font-medium text-amber-600 mb-3">
          {t.limit_reached_description}
        </p>
        <Link
          href="/dashboard/settings/billing"
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 hover:text-amber-900 transition-colors"
        >
          {t.limit_reached_upgrade_cta}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.div>
  )
}
