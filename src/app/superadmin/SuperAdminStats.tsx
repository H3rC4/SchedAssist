import { Calendar, Globe, CreditCard, Activity, Zap, Database, ExternalLink } from 'lucide-react'

interface StatsProps {
  tenants: any[]
}

export function SuperAdminStats({ tenants = [] }: StatsProps) {
  const safeTenants = Array.isArray(tenants) ? tenants : []
  const activeTenants = safeTenants.filter(t => t?.subscription_status === 'active').length
  const trialingTenants = safeTenants.filter(t => t?.subscription_status === 'trialing').length
  const monthlyRevenue = activeTenants * 70 // Based on $70 plan

  // Mocked Infrastructure Dates (In a real app, these would come from an admin_settings table or API)
  const renewals = [
    { id: '1', name: 'Dominio schedassist.com', date: '2026-05-15', provider: 'Namecheap', status: 'warning', icon: Globe },
    { id: '2', name: 'Plan Vercel Pro', date: '2026-04-20', provider: 'Vercel', status: 'ok', icon: Zap },
    { id: '3', name: 'Supabase Database', date: '2027-01-10', provider: 'Supabase', status: 'ok', icon: Database },
    { id: '4', name: 'Suscripción Whapi Enterprise', date: '2026-04-15', provider: 'Whapi.Cloud', status: 'danger', icon: Activity },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top Cards: Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#111] border border-[#222] p-6 rounded-[2rem] shadow-xl">
           <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <CreditCard className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Revenue Mensual</span>
           </div>
           <div className="text-4xl font-black text-white">${monthlyRevenue.toLocaleString()}</div>
           <div className="text-xs text-emerald-500 font-bold mt-2">MRR Proyectado</div>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded-[2rem] shadow-xl">
           <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Clientes Activos</span>
           </div>
           <div className="text-4xl font-black text-white">{activeTenants}</div>
           <div className="text-xs text-blue-500 font-bold mt-2">Suscriptores de pago</div>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded-[2rem] shadow-xl">
           <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Periodo Trial</span>
           </div>
           <div className="text-4xl font-black text-white">{trialingTenants}</div>
           <div className="text-xs text-indigo-500 font-bold mt-2">En proceso de conversión</div>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded-[2rem] shadow-xl">
           <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gray-500/10 flex items-center justify-center text-gray-400">
                <Globe className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Inquilinos</span>
           </div>
           <div className="text-4xl font-black text-white">{safeTenants.length}</div>
           <div className="text-xs text-gray-500 font-bold mt-2">Base instalada</div>
        </div>
      </div>

      {/* Reminders / Infrastructure Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-[#111] border border-[#222] rounded-[2.5rem] p-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <Calendar className="h-6 w-6 text-amber-500" /> Próximos Vencimientos
            </h3>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Infraestructura</span>
          </div>

          <div className="grid gap-4">
            {renewals.map(item => (
              <div key={item.id} className="flex items-center justify-between p-5 rounded-2xl bg-black/40 border border-[#222] hover:border-amber-500/30 transition-all group">
                <div className="flex items-center gap-5">
                   <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                     item.status === 'danger' ? 'bg-red-500/10 text-red-500' : 
                     item.status === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                   }`}>
                      <item.icon className="h-6 w-6" />
                   </div>
                   <div>
                      <h4 className="font-bold text-white group-hover:text-amber-500 transition-colors">{item.name}</h4>
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-1">{item.provider}</p>
                   </div>
                </div>
                <div className="text-right">
                   <div className={`text-sm font-black ${
                     item.status === 'danger' ? 'text-red-500' : 
                     item.status === 'warning' ? 'text-amber-500' : 'text-gray-400'
                   }`}>
                     {new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                   </div>
                   <div className="text-[8px] font-black text-gray-700 uppercase tracking-tighter mt-1">Fecha de Renovación</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-gradient-to-br from-[#111] to-[#1a1a1a] border border-[#222] rounded-[2.5rem] p-10 flex flex-col justify-between">
           <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Salud del Sistema</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Estado de Servicios Core</p>
              
              <div className="mt-10 space-y-6">
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-400">Database (Supabase)</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-400">Hosting (Vercel)</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-400">Auth Service</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-400">Whapi.Cloud API</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                 </div>
              </div>
           </div>

           <div className="mt-12 p-6 rounded-2xl bg-black border border-[#222] text-center">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Soporte Vía</p>
              <div className="flex items-center justify-center gap-4">
                 <a href="#" className="p-2 text-gray-400 hover:text-white transition-colors"><ExternalLink className="h-4 w-4" /></a>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
