"use client"
import { MapPin, WifiOff, ServerCrash, AlertTriangle, RefreshCw } from 'lucide-react'
import { hexToRgba } from '@/lib/utils'
import { motion } from 'framer-motion'

interface BookingLoadingProps {
  primaryColor: string
}

export function BookingLoading({ primaryColor }: BookingLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="relative">
        <div 
          className="h-12 w-12 border-4 rounded-full animate-spin" 
          style={{ 
            borderColor: hexToRgba(primaryColor, 0.1), 
            borderTopColor: primaryColor 
          }} 
        />
      </div>
    </div>
  )
}

interface BookingNotFoundProps {
  primaryColor: string
  t?: any
}

export function BookingNotFound({ primaryColor, t }: BookingNotFoundProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6 text-center">
      <div className="max-w-md">
        <div 
          className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6" 
          style={{ backgroundColor: hexToRgba(primaryColor, 0.1) }}
        >
          <MapPin className="h-8 w-8" style={{ color: primaryColor }} />
        </div>
        <h1 className="text-2xl font-black text-[#191c1e] mb-2 tracking-tighter uppercase">
          {t?.clinic_not_found || 'Clínica no encontrada'}
        </h1>
        <p className="text-sm font-bold text-[#191c1e]/40">
          {t?.invalid_link || 'El enlace que has seguido no parece ser válido.'}
        </p>
      </div>
    </div>
  )
}

interface BookingErrorProps {
  type: 'network' | 'server' | 'generic'
  primaryColor: string
  t: any
  onRetry?: () => void
}

export function BookingError({ type, primaryColor, t, onRetry }: BookingErrorProps) {
  const configs = {
    network: {
      icon: WifiOff,
      title: t.error_network || 'Connection Error',
      description: t.error_network_desc || 'Could not connect to the server.',
    },
    server: {
      icon: ServerCrash,
      title: t.error_server || 'Server Error',
      description: t.error_server_desc || 'There was a problem on our end.',
    },
    generic: {
      icon: AlertTriangle,
      title: t.error_generic || 'Something went wrong',
      description: t.error_generic_desc || 'An unexpected error occurred.',
    },
  }

  const config = configs[type]
  const Icon = config.icon

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center bg-surface p-6 text-center"
    >
      <div className="max-w-md">
        <div 
          className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: hexToRgba(primaryColor, 0.08) }}
        >
          <Icon className="h-8 w-8" style={{ color: primaryColor }} />
        </div>
        <h1 className="text-2xl font-black text-[#191c1e] mb-2 tracking-tighter uppercase">
          {config.title}
        </h1>
        <p className="text-sm font-bold text-[#191c1e]/40 mb-8">
          {config.description}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <RefreshCw className="h-4 w-4" />
            {t.retry || 'Try again'}
          </button>
        )}
      </div>
    </motion.div>
  )
}