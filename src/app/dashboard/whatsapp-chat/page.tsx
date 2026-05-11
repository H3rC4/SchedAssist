"use client"

import { useEffect, useState, useRef, useCallback } from 'react'
import { useLandingTranslation } from '@/components/LanguageContext'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Send, ArrowLeft, Phone, User, Bot, CheckCheck,
  MessageSquare, Loader2, ChevronRight
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface Conversation {
  phone_number: string
  client_id: string | null
  client_name: string
  last_message: string
  last_message_at: string
  last_direction: string
  last_sender_type: string | null
  unread_count: number
  bot_paused: boolean
}

interface ChatMessage {
  id: string
  content: string
  direction: 'inbound' | 'outbound'
  sender_type: 'bot' | 'manual' | null
  status: string
  created_at: string
  clients?: { id: string; first_name: string; last_name: string } | null
}

export default function WhatsAppChatPage() {
  const { language: lang, fullT: t } = useLandingTranslation()
  const supabase = createClient()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [tenantName, setTenantName] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showChatMobile, setShowChatMobile] = useState(false)
  const [botPaused, setBotPaused] = useState(false)
  const [showReactivateModal, setShowReactivateModal] = useState(false)
  const [reactivating, setReactivating] = useState(false)

  // Fetch tenant name
  useEffect(() => {
    async function loadTenant() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('tenant_users')
        .select('tenants(name)')
        .eq('user_id', user.id)
        .limit(1).single()
      if (data?.tenants) setTenantName((data.tenants as any).name || '')
    }
    loadTenant()
  }, [supabase])

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/conversations')
      if (!res.ok) return
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch (err) {
      console.error('Error fetching conversations:', err)
    } finally {
      setLoadingConversations(false)
    }
  }, [])

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (phone: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/whatsapp/messages?phone=${encodeURIComponent(phone)}`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages || [])
      setBotPaused(data.bot_paused || false)
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  // Initial load + polling
  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 5000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  // When selecting a conversation
  useEffect(() => {
    if (!selectedPhone) return
    fetchMessages(selectedPhone)
    const interval = setInterval(() => fetchMessages(selectedPhone), 4000)
    return () => clearInterval(interval)
  }, [selectedPhone, fetchMessages])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message
  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    if (!selectedPhone || !inputText.trim() || sending) return

    setSending(true)
    const text = inputText.trim()
    setInputText('')

    try {
      const res = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: selectedPhone, text }),
      })

      if (!res.ok) {
        const err = await res.json()
        console.error('Send error:', err)
      } else {
        // Optimistically add message to UI
        const optimisticMsg: ChatMessage = {
          id: `temp-${Date.now()}`,
          content: text,
          direction: 'outbound',
          sender_type: 'manual',
          status: 'sent',
          created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, optimisticMsg])
        // Refresh conversations to update preview
        fetchConversations()
      }
    } catch (err) {
      console.error('Error sending:', err)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  // Filter conversations
  const filteredConversations = conversations.filter(c =>
    c.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone_number.includes(searchQuery)
  )

  const selectedConversation = conversations.find(c => c.phone_number === selectedPhone)

  function handleSelectConversation(phone: string) {
    setSelectedPhone(phone)
    setShowChatMobile(true)
    const conv = conversations.find(c => c.phone_number === phone)
    setBotPaused(conv?.bot_paused || false)
  }

  function handleBackToList() {
    setShowChatMobile(false)
    setSelectedPhone(null)
    setBotPaused(false)
  }

  async function handleReactivate() {
    if (!selectedPhone) return
    setReactivating(true)
    try {
      const res = await fetch('/api/whatsapp/reactivate-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: selectedPhone }),
      })
      const data = await res.json()
      if (res.ok) {
        setBotPaused(false)
        setShowReactivateModal(false)
        // Update conversation list to reflect the change
        setConversations(prev => prev.map(c =>
          c.phone_number === selectedPhone ? { ...c, bot_paused: false } : c
        ))
      } else {
        console.error('Reactivate error:', data.error)
      }
    } catch (err) {
      console.error('Error reactivating bot:', err)
    } finally {
      setReactivating(false)
    }
  }

  return (
    <div className="h-full flex bg-surface overflow-hidden">
      {/* LEFT: Conversation List */}
      <div className={`
        flex-shrink-0 border-r border-on-surface/5 bg-surface-container-lowest flex flex-col
        transition-all duration-300
        ${showChatMobile && selectedPhone ? 'hidden md:flex' : 'flex'}
        w-full md:w-[320px]
      `}>
        {/* Header */}
        <div className="h-14 flex items-center px-5 border-b border-on-surface/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-black text-on-surface tracking-tight uppercase">
              {t.nav_messages || (lang === 'es' ? 'Mensajes' : lang === 'it' ? 'Messaggi' : 'Messages')}
            </h2>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/30 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'es' ? 'Buscar paciente...' : lang === 'it' ? 'Cerca paziente...' : 'Search patient...'}
              className="w-full bg-primary/[0.03] border border-primary/20 py-2.5 pl-9 pr-4 text-xs font-bold text-on-surface placeholder:text-primary/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none rounded-xl"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loadingConversations && conversations.length === 0 ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-on-surface/[0.04] flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-on-surface/[0.04] rounded" />
                    <div className="h-2.5 w-full bg-on-surface/[0.04] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-8 w-8 text-primary/10 mx-auto mb-3" />
              <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                {lang === 'es' ? 'Sin conversaciones' : lang === 'it' ? 'Nessuna conversazione' : 'No conversations'}
              </p>
              <p className="text-[10px] text-on-surface-muted mt-1">
                {lang === 'es' ? 'Los mensajes aparecerán aquí' : 'Messages will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5 p-2">
              {filteredConversations.map(conv => {
                const isActive = conv.phone_number === selectedPhone
                return (
                  <button
                    key={conv.phone_number}
                    onClick={() => handleSelectConversation(conv.phone_number)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                      isActive
                        ? 'bg-primary/5 text-primary ring-1 ring-primary/10'
                        : 'hover:bg-surface-container-low text-on-surface'
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-primary text-white' : 'bg-primary/[0.06] text-primary'
                    }`}>
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-bold truncate ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                          {conv.client_name}
                        </p>
                        <span className="text-[9px] font-bold text-on-surface-muted flex-shrink-0 ml-2">
                          {conv.last_message_at
                            ? format(parseISO(conv.last_message_at), 'HH:mm')
                            : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {conv.last_direction === 'outbound' && (
                          <span className="text-[9px] font-black text-on-surface-muted uppercase">
                            {conv.last_sender_type === 'manual' ? 'Tú:' : 'Sistema:'}
                          </span>
                        )}
                        <p className={`text-xs truncate ${isActive ? 'text-primary/70' : 'text-on-surface-muted'}`}>
                          {conv.last_message}
                        </p>
                      </div>
                    </div>
                    {conv.unread_count > 0 && (
                      <div className="h-5 min-w-[20px] rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black px-1.5 flex-shrink-0">
                        {conv.unread_count}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Chat Window */}
      <div className={`
        flex-1 flex flex-col bg-surface
        ${!showChatMobile || !selectedPhone ? 'hidden md:flex' : 'flex'}
      `}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-14 flex items-center justify-between px-5 border-b border-on-surface/5 flex-shrink-0 bg-surface-container-lowest">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToList}
                  className="md:hidden p-1.5 rounded-lg text-on-surface-muted hover:bg-surface-container-low transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="h-9 w-9 rounded-full bg-primary/[0.06] text-primary flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface leading-none">
                    {selectedConversation.client_name}
                  </p>
                  <p className="text-[9px] font-bold text-on-surface-muted mt-0.5 flex items-center gap-1">
                    <Phone className="h-2.5 w-2.5" />
                    {selectedConversation.phone_number}
                  </p>
                </div>
              </div>
              {botPaused && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-[9px] font-black uppercase tracking-widest">
                    <Bot className="h-3 w-3" />
                    {t.bot_paused || (lang === 'es' ? 'Bot Pausado' : lang === 'it' ? 'Bot in Pausa' : 'Bot Paused')}
                  </span>
                  <button
                    onClick={() => setShowReactivateModal(true)}
                    className="text-[9px] font-black text-primary uppercase tracking-widest hover:text-primary-light transition-colors px-3 py-1 rounded-full hover:bg-primary/5"
                  >
                    {t.reactivate_bot || (lang === 'es' ? 'Reactivar' : lang === 'it' ? 'Riattiva' : 'Reactivate')}
                  </button>
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                      {lang === 'es' ? 'Cargando chat...' : 'Loading chat...'}
                    </p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-10 w-10 text-primary/10 mb-3" />
                  <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                    {lang === 'es' ? 'Sin mensajes aún' : 'No messages yet'}
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const isInbound = msg.direction === 'inbound'
                    const isManual = msg.sender_type === 'manual'
                    const isBot = msg.sender_type === 'bot'
                    const showDate = idx === 0 ||
                      format(parseISO(msg.created_at), 'yyyy-MM-dd') !==
                      format(parseISO(messages[idx - 1].created_at), 'yyyy-MM-dd')

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="text-[9px] font-black text-on-surface-muted uppercase tracking-widest bg-surface-container-low px-3 py-1 rounded-full">
                              {format(parseISO(msg.created_at), 'dd MMM yyyy')}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isInbound
                              ? 'bg-surface-container-lowest border border-on-surface/5 text-on-surface'
                              : isManual
                                ? 'bg-primary text-white'
                                : 'bg-surface-container-low text-on-surface/70'
                          }`}>
                            {!isInbound && (
                              <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${
                                isManual ? 'text-white/60' : 'text-primary/50'
                              }`}>
                                {isManual ? tenantName : 'Sistema'}
                              </p>
                            )}
                            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                              isInbound ? 'text-on-surface-muted' : isManual ? 'text-white/50' : 'text-on-surface-muted'
                            }`}>
                              <span className="text-[9px] font-bold">
                                {format(parseISO(msg.created_at), 'HH:mm')}
                              </span>
                              {!isInbound && (
                                <CheckCheck className="h-3 w-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-on-surface/5 flex-shrink-0 bg-surface-container-lowest">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={lang === 'es' ? 'Escribe un mensaje...' : lang === 'it' ? 'Scrivi un messaggio...' : 'Type a message...'}
                    className="w-full bg-primary/[0.03] border border-primary/20 py-3 px-4 pr-12 text-sm font-bold text-on-surface placeholder:text-primary/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none rounded-xl"
                    disabled={sending}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="h-11 w-11 rounded-xl bg-primary text-white flex items-center justify-center transition-all hover:bg-primary-light hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 shadow-xl shadow-primary/20 flex-shrink-0"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
              <p className="text-[8px] font-bold text-on-surface-muted mt-2 text-center uppercase tracking-widest">
                {lang === 'es'
                  ? 'Al responder, el bot se pausa automáticamente para este paciente'
                  : lang === 'it'
                    ? 'Rispondendo, il bot si mette in pausa automaticamente per questo paziente'
                    : 'Replying will automatically pause the bot for this patient'}
              </p>
            </div>
          </>
        ) : (
          /* Empty State - No conversation selected */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-6">
              <MessageSquare className="h-10 w-10 text-primary/20" />
            </div>
            <h3 className="text-lg font-black text-on-surface tracking-tight mb-2">
              {lang === 'es' ? 'Chat de WhatsApp' : lang === 'it' ? 'Chat WhatsApp' : 'WhatsApp Chat'}
            </h3>
            <p className="text-sm font-medium text-on-surface-muted max-w-sm leading-relaxed">
              {lang === 'es'
                ? 'Selecciona una conversación para empezar a chatear con tus pacientes. Los mensajes del bot aparecen aquí también.'
                : lang === 'it'
                  ? 'Seleziona una conversazione per iniziare a chattare con i tuoi pazienti. Anche i messaggi del bot appaiono qui.'
                  : 'Select a conversation to start chatting with your patients. Bot messages appear here too.'}
            </p>
            <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
              <Bot className="h-3.5 w-3.5" />
              <span>
                {lang === 'es' ? 'Bot pausado automáticamente al responder' : 'Bot auto-paused on reply'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Reactivate Bot Confirmation Modal */}
      <AnimatePresence>
        {showReactivateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReactivateModal(false)}
              className="absolute inset-0 bg-on-surface/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-2xl p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-on-surface tracking-tighter uppercase mb-3">
                {t.reactivate_bot || (lang === 'es' ? 'Reactivar Bot' : lang === 'it' ? 'Riattiva Bot' : 'Reactivate Bot')}
              </h3>
              <p className="text-sm text-on-surface-muted leading-relaxed mb-8">
                {t.reactivate_bot_confirm || (lang === 'es'
                  ? 'El asistente automático volverá a responder a este paciente. ¿Continuar?'
                  : lang === 'it'
                    ? "L'assistente automatico risponderà di nuovo a questo paziente. Continuare?"
                    : 'The automatic assistant will respond to this patient again. Continue?')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReactivateModal(false)}
                  className="flex-1 py-3 bg-surface-container-low text-on-surface font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-surface-container-low/80 transition-colors"
                >
                  {t.cancel || (lang === 'es' ? 'Cancelar' : lang === 'it' ? 'Annulla' : 'Cancel')}
                </button>
                <button
                  onClick={handleReactivate}
                  disabled={reactivating}
                  className="flex-1 py-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50"
                >
                  {reactivating ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    t.confirm || (lang === 'es' ? 'Confirmar' : lang === 'it' ? 'Conferma' : 'Confirm')
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
