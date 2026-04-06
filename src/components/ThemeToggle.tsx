'use client';

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-10 h-10" />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden"
      aria-label="Toggle Theme"
    >
      <div className="relative w-6 h-6 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun
          className={`absolute h-5 w-5 text-amber-500 transition-all duration-500 ease-spring ${
            isDark ? "-translate-y-12 opacity-0 rotate-90" : "translate-y-0 opacity-100 rotate-0"
          }`}
        />
        {/* Moon Icon */}
        <Moon
          className={`absolute h-5 w-5 text-blue-400 transition-all duration-500 ease-spring ${
            isDark ? "translate-y-0 opacity-100 rotate-0" : "translate-y-12 opacity-0 -rotate-90"
          }`}
        />
      </div>
      
      {/* Decorative Glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity bg-gradient-to-tr ${isDark ? 'from-blue-500 to-purple-500' : 'from-amber-400 to-yellow-600'}`} />
    </button>
  );
}
