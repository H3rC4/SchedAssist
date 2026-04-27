"use client"

import { motion } from 'framer-motion'
import { Calendar, Users, CheckCircle, Clock, Target, ArrowUpRight, LucideIcon } from 'lucide-react'

// Mock components to avoid deep dependencies but maintain visual fidelity
const MiniStatCard = ({ name, value, icon: Icon, color }: { name: string, value: string, icon: LucideIcon, color: string }) => (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex items-center justify-between group hover:bg-slate-900/60 transition-all">
        <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{name}</p>
            <p className="text-xl font-black text-white">{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:bg-${color}-500 transition-all`}>
            <Icon className={`h-5 w-5 text-${color}-500 group-hover:text-slate-950`} />
        </div>
    </div>
)

const AppointmentItem = ({ name, time, status, service }: { name: string, time: string, status: string, service: string }) => (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-accent-500/30 transition-all group">
        <div className="h-12 w-12 rounded-xl bg-slate-800 flex flex-col items-center justify-center border border-white/5 group-hover:bg-accent-500 transition-all">
            <span className="text-[8px] font-black text-slate-400 group-hover:text-slate-950 uppercase leading-none mb-0.5">Hoy</span>
            <span className="text-sm font-black text-white group-hover:text-slate-950 leading-none">{time}</span>
        </div>
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-black text-white">{name}</p>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[6px] font-black text-slate-400 uppercase tracking-tighter border border-white/5">{service}</span>
            </div>
            <p className="text-[10px] font-bold text-slate-500">Confirmado vía WhatsApp</p>
        </div>
        <div className={`px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border ${
            status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-accent-500/10 text-accent-500 border-accent-500/20'
        }`}>
            {status}
        </div>
    </div>
)

export function RealisticDashboard() {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-4xl mx-auto p-4 md:p-8 rounded-[3rem] bg-primary-950 border border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] overflow-hidden relative"
        >
            {/* Background Glows */}
            <div className="absolute top-0 right-0 h-64 w-64 bg-accent-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 h-48 w-48 bg-primary-500/10 blur-[80px] rounded-full -ml-24 -mb-24" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                Panel de Hoy
                            </h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Sincronizado con WhatsApp</p>
                        </div>
                        <div className="flex gap-2">
                             <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                <ArrowUpRight className="h-4 w-4 text-slate-400" />
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <MiniStatCard name="Citas Hoy" value="24" icon={Calendar} color="accent" />
                        <MiniStatCard name="Pacientes" value="1.2k" icon={Users} color="primary" />
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Próximos Turnos</p>
                        <AppointmentItem name="Lucía García" time="14:30" status="confirmed" service="Consulta" />
                        <AppointmentItem name="Marco Rossi" time="15:00" status="pending" service="Limpieza" />
                        <AppointmentItem name="Elena Viale" time="16:15" status="confirmed" service="Ortodoncia" />
                    </div>
                </div>

                {/* Sidebar Preview */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="flex-1 bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
                            <Target className="h-8 w-8 text-indigo-400" />
                        </div>
                        <h4 className="text-lg font-black text-white tracking-tight mb-2">Progreso</h4>
                        <div className="relative h-24 w-24">
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                                <circle stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="transparent" r="16" cx="18" cy="18" />
                                <circle className="text-amber-500" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="100, 100" strokeLinecap="round" r="16" cx="18" cy="18" style={{ strokeDashoffset: 100 - 65 }} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-black text-white">65%</span>
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mt-4 leading-tight">Optimizing no-shows with automated WhatsApp reminders.</p>
                    </div>

                    <div className="p-6 bg-accent-500 rounded-3xl text-slate-950">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1">WhatsApp Cloud</p>
                        <p className="text-sm font-black leading-tight">Bot Activo & Respondiendo</p>
                    </div>
                </div>
            </div>

            {/* Noise overlay */}
            <div className="absolute inset-0 noise opacity-20 pointer-events-none" />
        </motion.div>
    )
}
