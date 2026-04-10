'use client'

import { Building2, Globe, ServerCrash } from 'lucide-react'
import { TenantActions } from './TenantActions'

interface SuperAdminContentProps {
  tenants: any[]
  error: any
}

export function SuperAdminContent({ tenants, error }: SuperAdminContentProps) {
  const paymentColors: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-8">
        {error && (
              <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400">
                <ServerCrash className="h-6 w-6" />
                <p>Error cargando la base de datos: {error.message}</p>
              </div>
            )}

            {tenants && tenants.length === 0 && (
              <div className="p-20 text-center flex flex-col items-center border border-dashed border-[#333] rounded-[2rem]">
                <Building2 className="h-16 w-16 text-gray-700 mb-6" />
                <h3 className="text-xl font-bold text-gray-300">No hay clínicas registradas</h3>
                <p className="text-gray-500 mt-2">Agrega tu primera clínica usando el botón superior.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {tenants?.map(tenant => (
                <div key={tenant.id} className="bg-[#111111] border border-[#222] rounded-[2rem] p-6 group hover:border-[#444] transition-colors relative overflow-hidden">
                  
                  {/* Decoración */}
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Globe className="h-24 w-24" />
                  </div>

                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#222] border border-[#333] flex items-center justify-center shadow-lg">
                      <Building2 className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white leading-tight">{tenant.name}</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-1 inline-block">ID: {tenant.slug}</span>
                    </div>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Especialidad</span>
                      <span className="text-gray-300">{tenant.settings?.specialty ?? '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Estado</span>
                      {tenant?.settings?.suspended
                        ? <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-wider">Suspendida</span>
                        : <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider">Activa</span>
                      }
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Creado</span>
                      <span className="text-gray-300">{new Date(tenant.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <TenantActions tenant={tenant} />
                </div>
              ))}
        </div>
      </div>
    </div>
  )
}
