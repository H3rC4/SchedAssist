import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Plus, Building2, Globe, ServerCrash } from 'lucide-react'
import { TenantForm } from './TenantForm'
import { SuperAdminContent } from './SuperAdminContent'
import { SUPERADMIN_EMAILS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function SuperAdminPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const userEmail = (user?.email || '').toLowerCase().trim()
  
  if (!user || !SUPERADMIN_EMAILS.includes(userEmail)) {
    redirect('/dashboard')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)
  
  // Obtener todas las clínicas (Tenants) ordenadas sin filtros de RLS
  const { data: tenants, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">Master Controller</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Infraestructura y Clientes de SchedAssist</p>
        </div>
        <TenantForm />
      </div>

      <SuperAdminContent tenants={tenants || []} error={error} />
    </div>
  )
}
