"use client"

interface ProgressBarProps {
  step: number
  totalSteps: number
  primaryColor: string
  secondaryColor: string
}

export function ProgressBar({ step, totalSteps, primaryColor, secondaryColor }: ProgressBarProps) {
  return (
    <div className="flex gap-2 px-2">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const s = i + 1
        return (
          <div
            key={s}
            className="h-1.5 flex-1 rounded-full transition-all duration-700"
            style={{
              backgroundColor: s < step ? primaryColor : s === step ? secondaryColor : 'rgba(0,0,0,0.05)'
            }}
          />
        )
      })}
    </div>
  )
}
