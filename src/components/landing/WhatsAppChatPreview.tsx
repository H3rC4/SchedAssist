"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Send, CheckCheck, MoreVertical, Phone, Video, Mic, Smile, Paperclip, CalendarCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLandingTranslation } from '@/components/LanguageContext'

const Message = ({ text, sender, time, delay }: { text: string, sender: 'user' | 'bot', time: string, delay: number }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: 20, x: sender === 'user' ? 20 : -20 }}
        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
        transition={{ delay, duration: 0.5, type: 'spring', damping: 15 }}
        className={`flex flex-col ${sender === 'user' ? 'items-end' : 'items-start'} mb-4`}
    >
        <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-medium shadow-md relative ${
            sender === 'user' 
                ? 'bg-[#005c55] text-white rounded-tr-none' 
                : 'bg-white text-[#191c1e] rounded-tl-none border border-[#e9edef]'
        }`}>
            {text}
            <div className={`absolute top-0 w-3 h-4 ${
                sender === 'user' 
                    ? 'right-[-8px] border-l-[10px] border-l-[#005c55] border-b-[10px] border-b-transparent' 
                    : 'left-[-8px] border-r-[10px] border-r-white border-b-[10px] border-b-transparent'
            }`} />
        </div>
        <div className="flex items-center gap-1 mt-1 px-1">
            <span className="text-[10px] text-[#667781] font-medium">{time}</span>
            {sender === 'user' && <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />}
        </div>
    </motion.div>
)

export function WhatsAppChatPreview() {
    const { t } = useLandingTranslation();
    const [step, setStep] = useState(0);
    const [loopKey, setLoopKey] = useState(0);

    useEffect(() => {
        let timers: NodeJS.Timeout[] = [];

        const startSequence = () => {
            setStep(0);
            timers.push(setTimeout(() => setStep(1), 2000)); // User typing
            timers.push(setTimeout(() => setStep(2), 4000)); // User message sent
            timers.push(setTimeout(() => setStep(3), 5500)); // Bot searching status
            timers.push(setTimeout(() => setStep(4), 8500)); // Bot confirmation
            timers.push(setTimeout(() => setStep(5), 10000)); // Synced badge
            timers.push(setTimeout(() => {
                setLoopKey(prev => prev + 1);
            }, 16000));
        };

        startSequence();

        return () => timers.forEach(clearTimeout);
    }, [loopKey]);

    return (
        <div className="w-full max-w-[340px] h-[580px] bg-[#f0f2f5] rounded-[2.5rem] border-[8px] border-[#191c1e] shadow-2xl flex flex-col overflow-hidden relative">
            {/* Header */}
            <div className="bg-[#005c55] p-4 pt-10 pb-4 flex items-center justify-between text-white shadow-lg relative z-20">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-black text-white border-2 border-white/30 overflow-hidden">
                        <CalendarCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold leading-none">SchedAssist AI</p>
                        <p className="text-[10px] text-white/70 font-medium mt-1">
                            {step === 3 ? t.whatsapp_chat_status_msg : t.whatsapp_chat_last_seen}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 opacity-70">
                    <Video className="h-4 w-4" />
                    <Phone className="h-4 w-4" />
                    <MoreVertical className="h-4 w-4" />
                </div>
            </div>

            {/* Chat Body */}
            <div 
                className="flex-1 p-4 overflow-y-auto bg-[#efeae2] relative" 
                style={{ 
                    backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', 
                    backgroundSize: 'contain' 
                }}
            >
                <div className="relative z-10 flex flex-col">
                    <div className="self-center bg-[#d1d7db] text-[#54656f] text-[11px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider mb-6 shadow-sm">
                        {t.whatsapp_chat_today}
                    </div>

                    <AnimatePresence key={loopKey}>
                        <Message text={t.whatsapp_chat_bot_msg} sender="bot" time="14:02" delay={0.5} />
                        
                        {step === 1 && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="self-end mb-4 bg-white/50 px-3 py-1 rounded-full text-[10px] font-bold text-[#667781] flex items-center gap-2"
                            >
                                <span className="animate-bounce">.</span>
                                <span className="animate-bounce [animation-delay:0.2s]">.</span>
                                <span className="animate-bounce [animation-delay:0.4s]">.</span>
                            </motion.div>
                        )}

                        {step >= 2 && (
                            <Message text={t.whatsapp_chat_user_msg} sender="user" time="14:05" delay={0} />
                        )}

                        {step === 3 && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 mb-4 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-primary/20 self-center shadow-sm"
                            >
                                <Mic className="h-3 w-3 text-primary animate-pulse" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{t.whatsapp_chat_status_msg}</span>
                            </motion.div>
                        )}

                        {step >= 4 && (
                            <Message text={t.whatsapp_chat_bot_done} sender="bot" time="14:06" delay={0} />
                        )}

                        {step >= 5 && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-primary/10 border border-primary/20 p-4 rounded-2xl mb-4 backdrop-blur-md shadow-inner"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                                        <CheckCheck className="h-4 w-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-tighter leading-none">{t.whatsapp_chat_synced}</p>
                                        <p className="text-[9px] text-primary/60 font-bold mt-0.5">{t.whatsapp_chat_realtime}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Input */}
            <div className="p-3 bg-[#f0f2f5] flex items-center gap-3 border-t border-[#e9edef] relative z-20">
                <Smile className="h-6 w-6 text-[#54656f] opacity-70" />
                <Paperclip className="h-6 w-6 text-[#54656f] opacity-70" />
                <div className="flex-1 bg-white rounded-full h-10 px-4 flex items-center text-[#54656f] text-sm shadow-sm border border-white overflow-hidden">
                    {step === 1 ? (
                        <motion.span 
                            initial={{ width: 0 }}
                            animate={{ width: "auto" }}
                            className="whitespace-nowrap overflow-hidden border-r-2 border-primary"
                        >
                            {t.whatsapp_chat_user_msg.slice(0, 15)}...
                        </motion.span>
                    ) : (
                        <span className="opacity-40">{t.whatsapp_chat_placeholder}</span>
                    )}
                </div>
                <div className="h-10 w-10 rounded-full bg-[#005c55] flex items-center justify-center text-white shadow-md active:scale-90 transition-transform">
                    {step === 1 ? <Send className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
                </div>
            </div>
            
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/20 rounded-full z-30" />
        </div>
    )
}
