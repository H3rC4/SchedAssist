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
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
        }`}>
            {text}
        </div>
        <div className="flex items-center gap-1 mt-1 px-1">
            <span className="text-[9px] text-slate-500 font-bold">{time}</span>
            {sender === 'user' && <CheckCheck className="h-3 w-3 text-emerald-500" />}
        </div>
    </motion.div>
)

export function WhatsAppChatPreview() {
    return (
        <div className="w-full max-w-sm h-[420px] bg-slate-900 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
            {/* Header */}
            <div className="bg-slate-800/80 backdrop-blur-md p-4 flex items-center gap-3 border-bottom border-white/5">
                <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center font-black text-slate-950">
                    SA
                </div>
                <div>
                    <p className="text-sm font-black text-white leading-none">SchedAssist Bot</p>
                    <p className="text-[10px] text-emerald-500 font-bold mt-1 tracking-widest uppercase">Online</p>
                </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-90">
                <div className="absolute inset-0 bg-slate-950/80 pointer-events-none" />
                <div className="relative z-10">
                    <Message text="Hola! Quiero agendar una limpieza dental para mañana." sender="user" time="14:02" delay={1} />
                    <Message text="¡Hola! 👋 Con gusto. Para mañana tengo los siguientes horarios: 10:00, 11:30 y 16:00. ¿Cuál te queda mejor?" sender="bot" time="14:02" delay={2} />
                    <Message text="El de las 11:30 está perfecto." sender="user" time="14:03" delay={3.5} />
                    <Message text="¡Excelente! 🦷 Tu cita ha sido agendada para mañana a las 11:30. Te enviaremos un recordatorio 2 horas antes." sender="bot" time="14:03" delay={4.5} />
                </div>
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-slate-800 border-t border-white/5 flex items-center gap-2">
                <div className="flex-1 bg-slate-700/50 rounded-full h-10 px-4 flex items-center text-slate-400 text-xs">
                    Escribe un mensaje...
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                    <Send className="h-4 w-4" />
                </div>
            </div>
            
            {/* Noise overlay */}
            <div className="absolute inset-0 noise opacity-20 pointer-events-none rounded-[2.5rem]" />
        </div>
    )
}
