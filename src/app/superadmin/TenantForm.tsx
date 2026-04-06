'use client'

import { useState } from 'react'
import { createTenantAction } from './actions'
import { Plus, X, Loader2 } from 'lucide-react'

export function TenantForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const form = new FormData(e.currentTarget)
    const res = await createTenantAction(form)

    if (res.error) {
       setError(res.error)
    } else {
       setSuccess(res.message!)
       setTimeout(() => setIsOpen(false), 2000)
    }
    setLoading(false)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0a0a0a] font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
      >
        <Plus className="h-4 w-4" /> Agregar Clínica
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-[#111] border border-[#222] rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-[#222]">
                 <h2 className="text-xl font-black text-white">Nueva Clínica (Tenant)</h2>
                 <button onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                    <X className="h-4 w-4" />
                 </button>
              </div>

              <form onSubmit={onSubmit} className="p-8 space-y-6">
                 {error && <div className="p-4 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium border border-red-500/20">{error}</div>}
                 {success && <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20">{success}</div>}

                 <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nombre Comercial</label>
                        <input name="clinicName" required placeholder="Ej: Odontología Giro" className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Slug (Identificador URL)</label>
                        <input name="clinicSlug" required placeholder="ej: odonto-giro" className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tipo de Negocio / Especialidad</label>
                        <select name="clinicSpecialty" required className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors appearance-none">
                           <option value="Clínica Médica General">Clínica Médica General</option>
                           <option value="Centro Odontológico">Centro Odontológico</option>
                           <option value="Peluquería / Salón de Belleza">Peluquería / Salón de Belleza</option>
                           <option value="Centro Oftalmológico">Centro Oftalmológico</option>
                           <option value="Veterinaria">Veterinaria</option>
                           <option value="Gastroenterología">Gastroenterología</option>
                           <option value="Consultoría / Otro">Consultoría / Otro</option>
                        </select>
                     </div>
                 </div>

                 <div className="pt-6 border-t border-[#222] space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Correo del Administrador</label>
                        <input name="adminEmail" type="email" required placeholder="contacto@odontogiro.com" className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contraseña Temporal</label>
                        <input name="adminPassword" required placeholder="mínimo 6 caracteres" minLength={6} className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Idioma del Bot / Sistema</label>
                        <select name="language" required className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors appearance-none">
                           <option value="es">Español 🇪🇸🇦🇷</option>
                           <option value="en">English 🇺🇸🇬🇧</option>
                           <option value="it">Italiano 🇮🇹</option>
                        </select>
                     </div>
                 </div>

                 <div className="pt-4">
                    <button disabled={loading} type="submit" className="w-full py-4 rounded-xl bg-white disabled:opacity-50 text-[#0a0a0a] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                       {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Aprovisionar Clínica Mágicamente'}
                    </button>
                    <p className="text-center text-[10px] text-gray-500 mt-4 uppercase tracking-widest">
                      Se creará 1 Servicio y 1 Profesional Demo auto.
                    </p>
                 </div>
              </form>
           </div>
        </div>
      )}
    </>
  )
}
