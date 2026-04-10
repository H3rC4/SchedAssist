import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SuperAdminStats } from '../SuperAdminStats'

export const dynamic = 'force-dynamic'

export default async function SuperAdminMetricsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)
  
  const { data: tenants } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">Métricas del Sistema</h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Rendimiento Operativo de SchedAssist</p>
      </div>

      <div className="space-y-12">
        {tenants && <SuperAdminStats tenants={tenants} />}
      </div>
    </div>
  )
}
