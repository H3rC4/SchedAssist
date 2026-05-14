import { Logo } from '@/components/Logo';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white p-6 overflow-hidden relative">
      {/* Decorative background blur to match Login/Auth pages */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/[0.03] blur-[120px] rounded-full -z-10 pointer-events-none" />
      
      <div className="relative group">
        {/* Premium Ring Loader */}
        <div className="h-32 w-32 border-[6px] border-primary/10 border-t-primary rounded-full animate-spin transition-all duration-700" />
        
        {/* Pulsing Logo Isotype */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Logo iconOnly className="h-12 w-12 animate-pulse" />
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center text-center">
        <header className="relative z-10">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] animate-pulse">
            Establishing Protocol
          </p>
          <div className="mt-4 flex flex-col items-center gap-2">
            <Logo iconOnly={false} textColor="text-primary/40" className="h-4 w-4 opacity-50" />
            <p className="text-[8px] font-bold text-[#191c1e]/20 uppercase tracking-widest">
              Securing identity nodes...
            </p>
          </div>
        </header>
      </div>
    </div>
  );
}

