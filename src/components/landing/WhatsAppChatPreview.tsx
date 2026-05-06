"use client"

import { motion } from 'framer-motion'
import { Send, CheckCheck } from 'lucide-react'

const Message = ({ text, sender, time, delay }: { text: string, sender: 'user' | 'bot', time: string, delay: number }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className={`flex flex-col ${sender === 'user' ? 'items-end' : 'items-start'} mb-4`}
    >
        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm ${
            sender === 'user' 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-white/[0.06] text-white/80 rounded-tl-none border border-white/[0.06]'
        }`}>
            {text}
        </div>
        <div className="flex items-center gap-1 mt-1 px-1">
            <span className="text-[9px] text-white/30 font-bold">{time}</span>
            {sender === 'user' && <CheckCheck className="h-3 w-3 text-primary-light" />}
        </div>
    </motion.div>
)

export function WhatsAppChatPreview() {
    return (
        <div className="w-full max-w-sm h-[420px] bg-[#090a0d] rounded-[2.5rem] border border-white/[0.06] shadow-2xl flex flex-col overflow-hidden relative">
            <div className="bg-white/[0.04] backdrop-blur-md p-4 flex items-center gap-3 border-b border-white/[0.06]">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center font-black text-white">
                    SA
                 </div>
                 <div>
                     <p className="text-sm font-black text-white leading-none">SchedAssist Bot</p>
                     <p className="text-[10px] text-primary-light font-bold mt-1 tracking-widest uppercase">Online</p>
                 </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-[#090a0d] relative">
                <div className="relative z-10">
                    <Message text="Hola! Quiero agendar una limpieza dental para mañana." sender="user" time="14:02" delay={1} />
                    <Message text="¡Hola! 👋 Con gusto. Para mañana tengo los siguientes horarios: 10:00, 11:30 y 16:00. ¿Cuál te queda mejor?" sender="bot" time="14:02" delay={2} />
                    <Message text="El de las 11:30 está perfecto." sender="user" time="14:03" delay={3.5} />
                    <Message text="¡Excelente! 🦷 Tu cita ha sido agendada para mañana a las 11:30. Te enviaremos un recordatorio 2 horas antes." sender="bot" time="14:03" delay={4.5} />
                </div>
            </div>

            <div className="p-4 bg-white/[0.04] border-t border-white/[0.06] flex items-center gap-2">
                <div className="flex-1 bg-white/[0.04] rounded-full h-10 px-4 flex items-center text-white/30 text-xs">
                    Escribe un mensaje...
                </div>
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
                    <Send className="h-4 w-4" />
                </div>
            </div>
            
            <div className="absolute inset-0 noise opacity-20 pointer-events-none rounded-[2.5rem]" />
        </div>
    )
}
