"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Search, Phone, Calendar, Loader2, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface Patient {
  id: string
  first_name: string
  last_name: string
  phone: string
  last_appointment?: string
  total_appointments: number
}

export default function DoctorPatientsPage() {
  const supabase = createClient()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchPatients() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!prof) return

      // Obtenemos los pacientes que tienen al menos una cita con este doctor
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          client_id,
          clients (
            id,
            first_name,
            last_name,
            phone
          ),
          start_at
        `)
        .eq('professional_id', prof.id)
        .order('start_at', { ascending: false })

      if (data) {
        // Agrupar por paciente y obtener estadísticas
        const patientMap = new Map<string, Patient>()
        
        data.forEach((row: any) => {
          if (!row.clients) return
          const cid = row.clients.id
          if (!patientMap.has(cid)) {
            patientMap.set(cid, {
              id: cid,
              first_name: row.clients.first_name,
              last_name: row.clients.last_name,
              phone: row.clients.phone,
              last_appointment: row.start_at,
              total_appointments: 0
            })
          }
          const p = patientMap.get(cid)!
          p.total_appointments++
        })

        setPatients(Array.from(patientMap.values()))
      }
      setLoading(false)
    }

    fetchPatients()
  }, [])

  const filteredPatients = patients.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  )

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mis Pacientes</h1>
          <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-widest">Listado de pacientes que has atendido</p>
        </div>

        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
          <input 
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-20 text-center">
            <Users className="h-16 w-16 text-slate-100 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-300">No se encontraron pacientes</h3>
          </div>
        ) : (
          filteredPatients.map(p => (
            <div key={p.id} className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xl border border-slate-100 group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-100 transition-colors">
                  {p.first_name[0]}{p.last_name[0]}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">{p.first_name} {p.last_name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Phone className="h-3.5 w-3.5" /> {p.phone}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full uppercase">
                      {p.total_appointments} Citas
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                {p.last_appointment && (
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Última Visita</p>
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2 justify-end">
                      <Calendar className="h-3.5 w-3.5 text-slate-300" />
                      {format(parseISO(p.last_appointment), "d 'de' MMM", { locale: es })}
                    </p>
                  </div>
                )}
                <button className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
