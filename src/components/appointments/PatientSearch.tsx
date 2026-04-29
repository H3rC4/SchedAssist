"use client"

import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Client } from '@/hooks/useAppointments'

interface PatientSearchProps {
  tenantId: string;
  lang: 'en' | 'es' | 'it';
  onSelect: (c: Client) => void;
  translations: any;
}

export function PatientSearch({ tenantId, lang, onSelect, translations: T }: PatientSearchProps) {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Client[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('clients').select('id, first_name, last_name, phone')
        .eq('tenant_id', tenantId)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(6)
      if (data) { setResults(data as Client[]); setOpen(data.length > 0) }
    }, 250)
    return () => clearTimeout(timer)
  }, [query, tenantId, supabase])

  return (
    <div ref={ref} className="relative">
      <label className="text-[10px] font-black text-secondary-500 uppercase tracking-widest ml-1 block mb-3 opacity-60">
        {T.searchPatient}
      </label>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-300" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          placeholder={T.searchPlaceholder}
          className="w-full rounded-xl bg-surface-container-low border-0 pl-12 pr-6 py-4 text-sm font-bold text-secondary-900 focus:bg-white focus:ring-4 focus:ring-primary-600/5 transition-all outline-none placeholder:text-secondary-300 placeholder:font-medium"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-spatial border border-surface-container-low z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {results.map(c => (
            <button 
              key={c.id} 
              type="button"
              onMouseDown={() => { onSelect(c); setQuery(`${c.first_name} ${c.last_name}`); setOpen(false) }}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-surface-container-low text-left transition-colors group border-b border-surface-container-low/50 last:border-0"
            >
              <div className="h-10 w-10 rounded-lg bg-surface-container-low flex items-center justify-center text-xs font-black text-secondary-500 group-hover:bg-primary-600 group-hover:text-white transition-all">
                {c.first_name.charAt(0)}{c.last_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-secondary-900 truncate group-hover:text-primary-600 transition-colors">
                  {c.first_name} {c.last_name}
                </p>
                <p className="text-xs text-secondary-400 font-medium truncate">{c.phone}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
