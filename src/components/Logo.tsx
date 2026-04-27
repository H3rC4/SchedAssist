"use client"

import React from 'react'

export function Logo({ className = "h-10 w-10", iconOnly = false }: { className?: string, iconOnly?: boolean }) {
  return (
    <div className={`flex items-center gap-2 group ${!iconOnly ? '' : 'justify-center'}`}>
      <div className={`relative ${className} transition-all duration-500 group-hover:scale-110 active:scale-95`}>
        <div className="absolute inset-0 bg-accent-500/10 blur-xl rounded-full -z-10 opacity-60" />
        
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          <circle cx="45" cy="45" r="33" stroke="#f59e0b" strokeWidth="4" />
          <path d="M45 12C26.77 12 12 26.77 12 45C12 52.5 14.5 59.5 18.7 65.2L14 77L26.4 73.5C31.8 76.3 38.2 78 45 78C63.23 78 78 63.23 78 45C78 26.77 63.23 12 45 12Z" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M45 27V45L55 55" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="76" cy="74" r="18" fill="#f59e0b" />
          <circle cx="69" cy="74" r="2.5" fill="white" />
          <circle cx="76" cy="74" r="2.5" fill="white" />
          <circle cx="83" cy="74" r="2.5" fill="white" />
        </svg>
      </div>

      {!iconOnly && (
        <span className="text-xl font-black text-white tracking-tight uppercase select-none">
          Sched<span className="text-accent-500 group-hover:text-accent-400 transition-colors">Assist</span>
        </span>
      )}
    </div>
  )
}
