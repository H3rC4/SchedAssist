"use client"

import { motion } from 'framer-motion'
import { Calendar, Users, Target, ArrowUpRight, LucideIcon } from 'lucide-react'
import { useLandingTranslation } from '@/components/LanguageContext'

const MiniStatCard = ({ name, value, icon: Icon }: { name: string, value: string, icon: LucideIcon }) => (
    <div className="bg-white/[0.04] backdrop-blur-md rounded-2xl p-4 border border-white/[0.06] flex items-center justify-between group hover:bg-white/[0.06] transition-all">
        <div>
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">{name}</p>
            <p className="text-xl font-black text-white">{value}</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-white/[0.06] flex items-center justify-center border border-white/[0.06] group-hover:scale-110 group-hover:bg-primary transition-all">
            <Icon className="h-5 w-5 text-white/50 group-hover:text-white" />
        </div>
    </div>
)

const AppointmentItem = ({ name, time, status, service, todayLabel, confirmedLabel }: { name: string, time: string, status: string, service: string, todayLabel: string, confirmedLabel: string }) => (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-primary/30 transition-all group">
        <div className="h-12 w-12 rounded-xl bg-white/[0.06] flex flex-col items-center justify-center border border-white/[0.06] group-hover:bg-primary transition-all">
            <span className="text-[8px] font-black text-white/40 group-hover:text-white uppercase leading-none mb-0.5">{todayLabel}</span>
            <span className="text-sm font-black text-white group-hover:text-white leading-none">{time}</span>
        </div>
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-black text-white">{name}</p>
                <span className="px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[6px] font-black text-white/40 uppercase tracking-tighter border border-white/[0.06]">{service}</span>
            </div>
            <p className="text-[10px] font-bold text-white/30">{confirmedLabel}</p>
        </div>
        <div className={`px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border ${
            status === 'confirmed' ? 'bg-primary/10 text-primary-light border-primary/20' : 'bg-white/[0.04] text-white/40 border-white/[0.06]'
        }`}>
            {status}
        </div>
    </div>
)

export function RealisticDashboard() {
    const { t } = useLandingTranslation();

    return (
        <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-4xl mx-auto p-4 md:p-8 rounded-[3rem] bg-[#090a0d] border border-white/[0.06] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] overflow-hidden relative"
        >
            <div className="absolute top-0 right-0 h-64 w-64 bg-primary/[0.06] blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 h-48 w-48 bg-white/[0.03] blur-[80px] rounded-full -ml-24 -mb-24" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                {t.dashboard_today_panel || 'Today\'s Panel'}
                            </h3>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">{t.whatsapp_chat_synced}</p>
                        </div>
                        <div className="flex gap-2">
                             <div className="h-8 w-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                                <ArrowUpRight className="h-4 w-4 text-white/40" />
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <MiniStatCard name={t.footer_features} value="24" icon={Calendar} />
                        <MiniStatCard name={t.clients_title || 'Patients'} value="1.2k" icon={Users} />
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest px-2">{t.upcoming_appointments || 'Upcoming Appointments'}</p>
                        <AppointmentItem 
                            name="Lucía García" 
                            time="14:30" 
                            status="confirmed" 
                            service="Consulta" 
                            todayLabel={t.whatsapp_chat_today}
                            confirmedLabel={t.whatsapp_chat_bot_done}
                        />
                        <AppointmentItem 
                            name="Marco Rossi" 
                            time="15:00" 
                            status="pending" 
                            service="Limpieza" 
                            todayLabel={t.whatsapp_chat_today}
                            confirmedLabel={t.whatsapp_chat_bot_done}
                        />
                        <AppointmentItem 
                            name="Elena Viale" 
                            time="16:15" 
                            status="confirmed" 
                            service="Ortodoncia" 
                            todayLabel={t.whatsapp_chat_today}
                            confirmedLabel={t.whatsapp_chat_bot_done}
                        />
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                            <Target className="h-8 w-8 text-primary-light" />
                        </div>
                        <h4 className="text-lg font-black text-white tracking-tight mb-2">{t.dashboard_progress || 'Progress'}</h4>
                        <div className="relative h-24 w-24">
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                                <circle stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="transparent" r="16" cx="18" cy="18" />
                                <circle className="text-primary" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="100, 100" strokeLinecap="round" r="16" cx="18" cy="18" style={{ strokeDashoffset: 100 - 65 }} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-black text-white">65%</span>
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-white/30 mt-4 leading-tight">Optimizing no-shows with automated WhatsApp reminders.</p>
                    </div>

                    <div className="p-6 bg-primary rounded-3xl text-white">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1">WhatsApp Cloud</p>
                        <p className="text-sm font-black leading-tight">{t.whatsapp_chat_bot_active || 'Bot Active & Responding'}</p>
                    </div>
                </div>
            </div>

            <div className="absolute inset-0 noise opacity-[0.04] pointer-events-none" />
        </motion.div>
    )
}
