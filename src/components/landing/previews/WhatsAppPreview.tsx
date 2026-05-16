'use client';

import { MessageCircle, Check, Clock } from 'lucide-react';

export function WhatsAppPreview() {
  const messages = [
    { from: 'bot', text: 'Hola! Confirmás tu turno para mañana a las 10:00 con Dr. García?', time: '14:30' },
    { from: 'user', text: 'Sí, confirmo. Gracias!', time: '14:32' },
    { from: 'bot', text: 'Perfecto! Te esperamos. Recordá traer tu orden médica.', time: '14:32' },
  ];

  return (
    <div className="bg-[#f7f9fb] rounded-xl overflow-hidden shadow-2xl border border-[#005c55]/5 text-[#191c1e] w-full">
      {/* Header */}
      <div className="bg-[#005c55] px-4 py-3 flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
          <MessageCircle className="h-3 w-3 text-white" />
        </div>
        <div>
          <h1 className="text-[6px] font-black text-white tracking-tighter">SchedAssist Bot</h1>
          <p className="text-[3px] text-white/60 font-black uppercase tracking-widest">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="p-3 space-y-2 bg-[#e5ddd5]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-2.5 py-1.5 rounded-lg ${
              msg.from === 'user' 
                ? 'bg-[#dcf8c6] rounded-tr-none' 
                : 'bg-white rounded-tl-none'
            }`}>
              <p className="text-[5px] text-[#191c1e] leading-relaxed">{msg.text}</p>
              <div className="flex items-center justify-end gap-0.5 mt-0.5">
                <span className="text-[3px] text-[#191c1e]/40">{msg.time}</span>
                {msg.from === 'user' && <Check className="h-1.5 w-1.5 text-[#34b7f1]" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 py-2 bg-[#f0f0f0] flex items-center gap-1.5">
        <div className="flex-1 h-5 bg-white rounded-full px-2 flex items-center">
          <span className="text-[4px] text-[#191c1e]/30">Escribe un mensaje...</span>
        </div>
        <div className="h-5 w-5 rounded-full bg-[#005c55] flex items-center justify-center">
          <MessageCircle className="h-2 w-2 text-white" />
        </div>
      </div>
    </div>
  );
}
