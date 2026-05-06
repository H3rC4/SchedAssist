'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export function MicrosoftAuthButton({ actionText = 'Continue with Microsoft' }: { actionText?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
      }
    });
  }

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-primary/[0.03] hover:bg-primary/[0.08] border border-primary/20 text-primary text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 group"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <svg className="h-5 w-5" viewBox="0 0 23 23" fill="none">
            <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
            <rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
            <rect x="1" y="12" width="10" height="10" fill="#00A4EF"/>
            <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
          </svg>
          {actionText}
        </>
      )}
    </button>
  );
}
