'use client';

import { CreditCard, ShieldCheck, Lock } from 'lucide-react';

export function PaymentsPreview() {
  return (
    <div className="bg-[#f7f9fb] rounded-xl overflow-hidden shadow-2xl border border-[#005c55]/5 text-[#191c1e] w-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#005c55]/5 flex items-center justify-between">
        <div>
          <p className="text-[5px] font-black text-[#191c1e]/40 uppercase tracking-[0.3em] mb-0.5">Secure Checkout</p>
          <h1 className="text-[8px] font-black tracking-tighter">Payment Details</h1>
        </div>
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 rounded-full">
          <ShieldCheck className="h-2 w-2 text-emerald-600" />
          <span className="text-[3px] font-black text-emerald-600 uppercase tracking-widest">SSL</span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {/* Plan Summary */}
        <div className="bg-white p-2.5 rounded-lg">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[5px] font-black text-[#191c1e] uppercase tracking-widest">Pro Plan</span>
            <span className="text-[7px] font-black text-[#005c55]">$49/mo</span>
          </div>
          <div className="h-px bg-[#005c55]/5 mb-1.5" />
          <div className="flex items-center justify-between">
            <span className="text-[4px] text-[#191c1e]/50">Billed monthly</span>
            <span className="text-[5px] font-black text-[#191c1e]">Total: $49.00</span>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white p-2.5 rounded-lg space-y-1.5">
          <p className="text-[5px] font-black text-[#191c1e] uppercase tracking-widest mb-1">Card Information</p>
          
          <div className="h-6 bg-[#f7f9fb] rounded border border-[#005c55]/10 px-2 flex items-center gap-1.5">
            <CreditCard className="h-2 w-2 text-[#005c55]/30" />
            <span className="text-[5px] text-[#191c1e]/40">4242 4242 4242 4242</span>
          </div>
          
          <div className="grid grid-cols-2 gap-1.5">
            <div className="h-6 bg-[#f7f9fb] rounded border border-[#005c55]/10 px-2 flex items-center">
              <span className="text-[5px] text-[#191c1e]/40">12/27</span>
            </div>
            <div className="h-6 bg-[#f7f9fb] rounded border border-[#005c55]/10 px-2 flex items-center gap-1">
              <Lock className="h-2 w-2 text-[#005c55]/30" />
              <span className="text-[5px] text-[#191c1e]/40">123</span>
            </div>
          </div>
        </div>

        {/* Pay Button */}
        <div className="h-7 bg-[#005c55] rounded-lg flex items-center justify-center">
          <span className="text-[5px] font-black text-white uppercase tracking-[0.3em]">Pay $49.00</span>
        </div>

        <p className="text-[3px] font-bold text-[#191c1e]/30 text-center uppercase tracking-widest">
          Secured by Stripe
        </p>
      </div>
    </div>
  );
}
