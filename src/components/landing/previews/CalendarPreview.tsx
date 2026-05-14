'use client';

import { Clock, User } from 'lucide-react';

export function CalendarPreview() {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const appointments = [
    { day: 0, time: '09:00', name: 'M. González', color: '#005c55' },
    { day: 0, time: '11:00', name: 'J. Pérez', color: '#855300' },
    { day: 1, time: '10:00', name: 'A. López', color: '#005c55' },
    { day: 2, time: '14:00', name: 'R. Silva', color: '#ba1a1a' },
    { day: 2, time: '16:00', name: 'C. Ruiz', color: '#005c55' },
    { day: 3, time: '09:30', name: 'L. Martínez', color: '#005c55' },
    { day: 4, time: '11:30', name: 'D. Fernández', color: '#855300' },
  ];

  return (
    <div className="bg-[#f7f9fb] rounded-xl overflow-hidden shadow-2xl border border-[#005c55]/5 text-[#191c1e] w-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#005c55]/5 flex items-center justify-between">
        <div>
          <p className="text-[5px] font-black text-[#191c1e]/40 uppercase tracking-[0.3em] mb-0.5">Weekly Schedule</p>
          <h1 className="text-[8px] font-black tracking-tighter">May 12 — 16, 2026</h1>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-4 w-4 rounded bg-[#005c55]/5 flex items-center justify-center text-[#005c55]">
            <Clock className="h-2 w-2" />
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-3">
        {/* Days Header */}
        <div className="grid grid-cols-5 gap-1 mb-2">
          {days.map((day, idx) => (
            <div key={day} className={`text-center py-1.5 rounded-lg ${idx === 2 ? 'bg-[#005c55] text-white' : 'bg-white'}`}>
              <p className="text-[4px] font-black uppercase tracking-widest opacity-60">{day}</p>
              <p className="text-[8px] font-black tracking-tighter">{12 + idx}</p>
            </div>
          ))}
        </div>

        {/* Time slots + Appointments */}
        <div className="space-y-1">
          {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'].map((time) => (
            <div key={time} className="flex items-center gap-2">
              <span className="text-[4px] font-black text-[#191c1e]/30 uppercase tracking-widest w-6 text-right">{time}</span>
              <div className="flex-1 h-5 bg-white rounded-md border border-[#005c55]/5 relative overflow-hidden">
                {appointments
                  .filter((a) => a.time === time)
                  .map((app, idx) => (
                    <div
                      key={idx}
                      className="absolute top-0.5 h-4 rounded px-1.5 flex items-center gap-1"
                      style={{
                        left: `${(app.day * 20) + 2}%`,
                        width: '18%',
                        backgroundColor: `${app.color}15`,
                        borderLeft: `2px solid ${app.color}`,
                      }}
                    >
                      <User className="h-1.5 w-1.5 shrink-0" style={{ color: app.color }} />
                      <span className="text-[4px] font-black truncate" style={{ color: app.color }}>{app.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
