'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function createTenantAction(formData: FormData) {
  const clinicName = formData.get('clinicName') as string
  const clinicSlug = formData.get('clinicSlug') as string
  const adminEmail = formData.get('adminEmail') as string
  const adminPassword = formData.get('adminPassword') as string
  const clinicSpecialty = formData.get('clinicSpecialty') as string
  const language = formData.get('language') as string || 'es'

  if (!clinicName || !clinicSlug || !adminEmail || !adminPassword || !clinicSpecialty) {
    return { error: 'Faltan campos obligatorios' }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const welcomeMsg = language === 'it' 
        ? `Benvenuti a ${clinicName}! Sono il tuo assistente virtuale di ${clinicSpecialty}.`
        : language === 'en'
        ? `Welcome to ${clinicName}! I am your virtual assistant for ${clinicSpecialty}.`
        : `¡Bienvenido a ${clinicName}! Soy tu asistente bot de ${clinicSpecialty}.`

    // 1. Insertar la nueva clínica (guardamos el email del admin en settings para referencia)
    const { data: newTenant, error: tenantErr } = await supabase
      .from('tenants')
      .insert([{
        name: clinicName,
        slug: clinicSlug.toLowerCase(),
        timezone: 'America/Argentina/Buenos_Aires',
        settings: { 
          specialty: clinicSpecialty, 
          language, 
          welcome_message: welcomeMsg,
          admin_email: adminEmail  // guardamos para mostrar en superadmin
        }
      }])
      .select().single()

    if (tenantErr) throw tenantErr

    const tenantId = newTenant.id

    // 2. Crear usuario de Auth
    let userId = ''
    const { data: existingUser } = await supabase.auth.admin.getUserById(adminEmail).catch(() => ({ data: null }))
    
    // Si no encontramos por ID, intentamos crearlo
    const { data: newUserObj, error: authErr } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true
    })

    if (authErr) {
        if (authErr.message.includes('already registered')) {
            return { error: 'Ese email ya está siendo utilizado en Auth.' }
        } else {
            throw authErr
        }
    }
    userId = newUserObj.user.id

    // 3. Vincularlo al tenant
    const { error: tuErr } = await supabase.from('tenant_users').insert([{
        tenant_id: tenantId,
        user_id: userId,
        role: 'tenant_admin'
    }])
    if (tuErr) throw tuErr

    // 4. Crear Servicio Defecto
    const { data: svc, error: svcErr } = await supabase.from('services').insert([{
        tenant_id: tenantId, 
        name: 'Consulta General', 
        duration_minutes: 30, 
        price: null
    }]).select().single()
    if (svcErr) throw svcErr

    // 5. Crear Doctor Defecto (ya con email, phone y specialty tras migración)
    const { data: prof, error: profErr } = await supabase.from('professionals').insert([{
        tenant_id: tenantId, 
        full_name: 'Dr. Principal',
        specialty: clinicSpecialty,
        email: adminEmail,
        phone: null, 
        active: true
    }]).select().single()
    if (profErr) throw profErr

    // 6. Horarios Demo (Lunes a Viernes de 9 a 17)
    const days = [1,2,3,4,5]
    for (const d of days) {
        await supabase.from('business_hours').insert([{
            tenant_id: tenantId,
            professional_id: prof.id,
            day_of_week: d,
            start_time: '09:00:00',
            end_time: '17:00:00'
        }])
    }

    revalidatePath('/superadmin')
    return { success: true, message: `Clínica ${clinicName} inicializada correctamente.` }
    
  } catch (err: any) {
    console.error('Error aprovisionando tenant:', err)
    return { error: err.message || 'Error desconocido aprovisionando base de datos' }
  }
}
export async function toggleSuspendTenantAction(tenantId: string, currentlySuspended: boolean) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { data: tenant, error: readErr } = await supabase
      .from('tenants').select('settings').eq('id', tenantId).single()
    if (readErr) throw readErr

    const updatedSettings = { ...(tenant.settings || {}), suspended: !currentlySuspended }

    const { error } = await supabase
      .from('tenants')
      .update({ settings: updatedSettings })
      .eq('id', tenantId)

    if (error) throw error

    revalidatePath('/superadmin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function updateTenantEmailAction(tenantId: string, newEmail: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 1. Find the user ID linked to this tenant
    const { data: tenantUser, error: findErr } = await supabase
      .from('tenant_users')
      .select('user_id')
      .eq('tenant_id', tenantId)
      .single()
    
    if (findErr) throw findErr

    // 2. Update Auth email using admin method
    const { error: authErr } = await supabase.auth.admin.updateUserById(
      tenantUser.user_id,
      { email: newEmail }
    )
    if (authErr) throw authErr

    // 3. Update tenant settings metadata (admin_email)
    const { data: tenant, error: readErr } = await supabase
      .from('tenants').select('settings').eq('id', tenantId).single()
    if (readErr) throw readErr

    const updatedSettings = { ...(tenant.settings || {}), admin_email: newEmail }
    const { error: dbErr } = await supabase
      .from('tenants')
      .update({ settings: updatedSettings })
      .eq('id', tenantId)
    
    if (dbErr) throw dbErr

    revalidatePath('/superadmin')
    return { success: true, message: 'Email del administrador actualizado correctamente.' }
  } catch (err: any) {
    console.error('Error actualizando email:', err)
    return { error: err.message }
  }
}

export async function getTenantStats(tenantId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const [clients, appointments, professionals, services, tenantData] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('professionals').select('id, full_name, active').eq('tenant_id', tenantId),
    supabase.from('services').select('id, name').eq('tenant_id', tenantId),
    supabase.from('tenants').select('settings').eq('id', tenantId).single(),
  ])

  return {
    clientCount: clients.count ?? 0,
    appointmentCount: appointments.count ?? 0,
    professionals: professionals.data ?? [],
    services: services.data ?? [],
    adminEmail: tenantData.data?.settings?.admin_email ?? null,
  }
}

export async function deleteTenantAction(tenantId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 1. Get linked auth user before deleting
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('user_id')
      .eq('tenant_id', tenantId)
      .single()

    // 2. Get all professionals to delete their business_hours
    const { data: profs } = await supabase
      .from('professionals')
      .select('id')
      .eq('tenant_id', tenantId)

    const profIds = (profs || []).map((p: any) => p.id)

    // 3. Delete in dependency order
    if (profIds.length > 0) {
      await supabase.from('business_hours').delete().in('professional_id', profIds)
      await supabase.from('availability_rules').delete().in('professional_id', profIds)
    }
    await supabase.from('appointments').delete().eq('tenant_id', tenantId)
    await supabase.from('clients').delete().eq('tenant_id', tenantId)
    await supabase.from('services').delete().eq('tenant_id', tenantId)
    await supabase.from('professionals').delete().eq('tenant_id', tenantId)
    await supabase.from('tenant_users').delete().eq('tenant_id', tenantId)

    // 4. Finally delete the tenant itself
    const { error } = await supabase.from('tenants').delete().eq('id', tenantId)
    if (error) throw error

    // 5. Delete Auth user
    if (tenantUser?.user_id) {
      await supabase.auth.admin.deleteUser(tenantUser.user_id)
    }

    revalidatePath('/superadmin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
