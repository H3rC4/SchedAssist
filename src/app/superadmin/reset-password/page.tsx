'use client';

import { useState } from 'react';
import { ShieldCheck, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SuperAdminResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message);
    } else {
      setDone(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-6">
      <div className="max-w-sm w-full bg-[#111] border border-[#222] rounded-3xl p-10 text-center">
        <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <ShieldCheck className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-6">
          Nueva Contraseña
        </h1>

        {!done ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nueva contraseña (mín. 8 caracteres)"
                required
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-4 text-white font-bold text-sm focus:border-amber-500 outline-none pr-12"
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-red-400 font-bold">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar contraseña'}
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm text-emerald-400 font-bold">Contraseña actualizada.</p>
            <a href="/superadmin" className="text-xs text-amber-500 hover:underline font-bold uppercase tracking-widest">
              Ir al Panel
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
