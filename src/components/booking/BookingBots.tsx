"use client"
import { MessageCircle, Send } from 'lucide-react'
import { Language, translations } from '@/lib/i18n'

interface BookingBotsProps {
  settings: any
  tenantName?: string
  lang?: Language
}

function buildWhatsAppUrl(phone: string, message: string): string {
  // Clean phone number: remove spaces, dashes, parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
  // Ensure it starts with country code (no leading + or 00)
  const formattedPhone = cleanPhone.replace(/^(\+|00)/, '')
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
}

export function BookingBots({ settings, tenantName, lang = 'es' }: BookingBotsProps) {
  const t = translations[lang] || translations['es']

  const whatsappUrl = settings?.whatsapp_bot_url
    ? settings.whatsapp_bot_url
    : settings?.whatsapp_phone
      ? buildWhatsAppUrl(settings.whatsapp_phone, `${t.chat_whatsapp_msg || 'Hola, quiero reservar un turno'}${tenantName ? ` en ${tenantName}` : ''}`)
      : null

  return (
    <div className="fixed bottom-8 left-8 flex flex-col gap-3 z-50">
      {whatsappUrl && (
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 bg-[#25D366] text-white p-4 rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all">
          <div className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out whitespace-nowrap">
            <span className="px-2 font-black uppercase tracking-widest text-[10px]">{t.chat_whatsapp}</span>
          </div>
          <MessageCircle className="h-6 w-6 drop-shadow-md" />
        </a>
      )}
      {settings?.telegram_bot_url && (
        <a href={settings.telegram_bot_url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 bg-[#0088cc] text-white p-4 rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all">
          <div className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out whitespace-nowrap">
            <span className="px-2 font-black uppercase tracking-widest text-[10px]">{t.chat_telegram}</span>
          </div>
          <Send className="h-6 w-6 drop-shadow-md" />
        </a>
      )}
    </div>
  )
}