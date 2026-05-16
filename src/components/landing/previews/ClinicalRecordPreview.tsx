'use client';

import { FileText, Calendar, Stethoscope, Pill, Activity } from 'lucide-react';

export function ClinicalRecordPreview() {
  return (
    <div className="bg-[#f7f9fb] rounded-xl overflow-hidden shadow-2xl border border-[#005c55]/5 text-[#191c1e] w-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#005c55]/5">
        <div className="flex items-center gap-1.5 mb-0.5">
          <FileText className="h-2 w-2 text-[#005c55]" />
          <p className="text-[5px] font-black text-[#005c55] uppercase tracking-[0.3em]">Clinical Record</p>
        </div>
        <h1 className="text-[8px] font-black tracking-tighter">María González</h1>
        <p className="text-[4px] font-black text-[#191c1e]/40 uppercase tracking-widest">ID: PT-2026-00142</p>
      </div>

      <div className="p-3 space-y-2">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'Age', value: '34', icon: Calendar },
            { label: 'Weight', value: '62kg', icon: Activity },
            { label: 'Blood', value: 'O+', icon: Activity },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-2 rounded-lg text-center">
              <div className="h-4 w-4 rounded bg-[#005c55]/5 flex items-center justify-center text-[#005c55] mx-auto mb-1">
                <stat.icon className="h-2 w-2" />
              </div>
              <p className="text-[7px] font-black tracking-tighter">{stat.value}</p>
              <p className="text-[3px] font-black text-[#191c1e]/40 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Form Fields */}
        <div className="bg-white p-2.5 rounded-lg space-y-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Stethoscope className="h-2 w-2 text-[#005c55]" />
            <p className="text-[5px] font-black text-[#191c1e] uppercase tracking-widest">Diagnosis</p>
          </div>
          <div className="h-6 bg-[#f7f9fb] rounded border border-[#005c55]/10 px-2 flex items-center">
            <span className="text-[5px] text-[#191c1e]/60">Hypertension stage 1 - controlled</span>
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-lg space-y-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Pill className="h-2 w-2 text-[#005c55]" />
            <p className="text-[5px] font-black text-[#191c1e] uppercase tracking-widest">Prescription</p>
          </div>
          <div className="space-y-1">
            {['Losartan 50mg - 1x/day', 'Amlodipine 5mg - 1x/day'].map((med, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-[#005c55]" />
                <span className="text-[5px] text-[#191c1e]/70">{med}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-lg">
          <p className="text-[5px] font-black text-[#191c1e] uppercase tracking-widest mb-1">Notes</p>
          <div className="h-8 bg-[#f7f9fb] rounded border border-[#005c55]/10 px-2 py-1">
            <span className="text-[4px] text-[#191c1e]/40">Patient responding well to treatment...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
