'use client';

import { Activity, Users, ShieldCheck, Clock, Calendar, Layers, ArrowUpRight, Target, TrendingUp, ArrowRight } from 'lucide-react';

export function DashboardPreview() {
  const kpis = [
    { label: 'Turnos', value: 128, icon: Activity, trend: '+12%' },
    { label: 'Pacientes', value: 86, icon: Users, trend: '+5%' },
    { label: 'Confirmados', value: 94, icon: ShieldCheck, trend: '88%' },
    { label: 'Pendientes', value: 12, icon: Clock, trend: '-2%' },
  ];

  const appointments = [
    { name: 'María González', time: '09:00', service: 'Consulta General', status: 'confirmed', day: '14', month: 'MAY' },
    { name: 'Juan Pérez', time: '10:30', service: 'Cardiología', status: 'pending', day: '14', month: 'MAY' },
    { name: 'Ana López', time: '14:00', service: 'Pediatría', status: 'confirmed', day: '14', month: 'MAY' },
  ];

  return (
    <div className="bg-[#f7f9fb] rounded-xl overflow-hidden shadow-2xl border border-[#005c55]/5 text-[#191c1e] w-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#005c55]/5">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className="h-1 w-1 rounded-full bg-[#005c55] animate-pulse" />
          <p className="text-[5px] font-black text-[#191c1e]/40 uppercase tracking-[0.3em]">Operational Pulse • May 14, 2026</p>
        </div>
        <h1 className="text-[8px] font-black tracking-tighter leading-tight">
          Dashboard <span className="text-[#005c55]/40 italic">Overview</span>
        </h1>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-1.5 p-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white p-2.5 rounded-lg border border-transparent hover:border-[#005c55]/10 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="h-4 w-4 rounded bg-[#005c55]/5 flex items-center justify-center text-[#005c55]">
                <kpi.icon className="h-2 w-2" />
              </div>
              <span className="text-[4px] font-black text-[#005c55]/40 uppercase tracking-widest">{kpi.trend}</span>
            </div>
            <p className="text-[4px] font-black text-[#191c1e]/40 uppercase tracking-[0.2em] mb-0.5">{kpi.label}</p>
            <h3 className="text-[10px] font-black tracking-tighter text-[#191c1e]">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 px-3 pb-3">
        {/* Appointments List */}
        <div className="col-span-2 space-y-1.5">
          <p className="text-[5px] font-black text-[#191c1e] tracking-tighter uppercase px-1">Today's Agenda</p>
          {appointments.map((app, idx) => (
            <div key={idx} className="bg-white p-2 rounded-lg flex items-center gap-2 border border-transparent hover:border-[#005c55]/10 transition-all">
              <div className="h-6 w-6 rounded bg-[#005c55] text-white flex flex-col items-center justify-center font-black shrink-0">
                <span className="text-[3px] uppercase opacity-60 leading-none">{app.month}</span>
                <span className="text-[7px] leading-none">{app.day}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[6px] font-black text-[#191c1e] truncate leading-none mb-0.5">{app.name}</p>
                <div className="flex items-center gap-1 text-[#191c1e]/50 font-bold text-[4px] uppercase tracking-widest">
                  <span className="flex items-center gap-0.5"><Clock className="h-1.5 w-1.5" /> {app.time}</span>
                  <span className="flex items-center gap-0.5"><Layers className="h-1.5 w-1.5" /> {app.service}</span>
                </div>
              </div>
              <div className={`px-1.5 py-0.5 rounded-full text-[3px] font-black uppercase tracking-widest shrink-0 ${
                app.status === 'confirmed' ? 'bg-[#005c55]/5 text-[#005c55]' : 'bg-[#191c1e]/5 text-[#191c1e]/40'
              }`}>
                {app.status}
              </div>
              <div className="h-4 w-4 rounded bg-[#f7f9fb] flex items-center justify-center text-[#191c1e]/10">
                <ArrowUpRight className="h-2 w-2" />
              </div>
            </div>
          ))}
        </div>

        {/* Progress Ring */}
        <div className="bg-white p-3 rounded-lg flex flex-col items-center text-center">
          <div className="h-5 w-5 rounded bg-[#005c55]/5 flex items-center justify-center text-[#005c55] mb-1.5">
            <Target className="h-2.5 w-2.5" />
          </div>
          <h4 className="text-[6px] font-black tracking-tighter uppercase mb-1">Goal</h4>
          <div className="relative h-12 w-12">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <circle stroke="currentColor" strokeWidth="3" fill="transparent" r="16" cx="18" cy="18" className="text-[#191c1e]/5" />
              <circle stroke="currentColor" strokeWidth="3" fill="transparent" strokeLinecap="round" r="16" cx="18" cy="18" className="text-[#005c55]"
                strokeDasharray="73 100" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[8px] font-black tracking-tighter text-[#191c1e]">73%</span>
            </div>
          </div>
          <div className="mt-2 w-full grid grid-cols-3 gap-0.5 pt-1.5 border-t border-[#191c1e]/5">
            <div><p className="text-[7px] font-black">94</p><p className="text-[3px] font-black text-[#191c1e]/40 uppercase tracking-widest">Done</p></div>
            <div><p className="text-[7px] font-black">12</p><p className="text-[3px] font-black text-[#191c1e]/40 uppercase tracking-widest">Wait</p></div>
            <div><p className="text-[7px] font-black">128</p><p className="text-[3px] font-black text-[#191c1e]/40 uppercase tracking-widest">Total</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
