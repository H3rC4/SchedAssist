"use client"
import { motion } from 'framer-motion'

interface ProgressBarProps {
  step: number
  totalSteps?: number
  primaryColor: string
  secondaryColor: string
}

export function ProgressBar({ step, totalSteps = 5, primaryColor, secondaryColor }: ProgressBarProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 px-2"
    >
      {Array.from({ length: totalSteps }).map((_, i) => i + 1).map((s) => (
        <div
          key={s}
          className="h-1.5 flex-1 rounded-full transition-all duration-700"
          style={{
            backgroundColor: s < step ? primaryColor : s === step ? secondaryColor : 'rgba(0,0,0,0.05)'
          }}
        />
      ))}
    </motion.div>
  )
}