import { Logo } from '@/components/Logo';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 animate-in fade-in duration-700">
      <div className="relative group">
        {/* Subtle Outer Glow */}
        <div className="absolute inset-0 bg-amber-500/10 blur-[60px] rounded-full scale-150 animate-pulse" />
        
        {/* Loader Icon Container */}
        <div className="relative h-24 w-24 flex items-center justify-center overflow-hidden">
          <Logo iconOnly className="h-20 w-20 animate-bounce duration-1000" />
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center">
        <Logo iconOnly={false} className="h-0 w-0 invisible" /> {/* This is just to use the text part if needed, but I'll actually just call Logo */}
        <div className="scale-125">
          <Logo iconOnly={false} className="h-6 w-6" />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.32s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.16s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
