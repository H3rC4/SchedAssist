'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { SUPERADMIN_EMAILS } from '@/lib/constants'

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error.message)
    return redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // Bouncer Logic - SuperAdmins
  if (SUPERADMIN_EMAILS.includes(email)) {
    return redirect('/superadmin')
  }

  // Check if tenant is suspended and get user role
  const { data: userData } = await supabase.auth.getUser()
  if (userData?.user) {
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id, role, tenants(settings)')
      .eq('user_id', userData.user.id)
      .single()

    const settings = (tenantUser?.tenants as any)?.settings
    if (settings?.suspended) {
      await supabase.auth.signOut()
      return redirect(`/login?error=${encodeURIComponent('Tu cuenta ha sido suspendida por falta de pago. Por favor, regulariza tu deuda para continuar.')}`)
    }

    if (tenantUser?.role === 'professional') {
      return redirect('/doctor')
    }
  }

  return redirect('/dashboard')
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  cookies().delete('sa_2fa_verified')
  return redirect('/')
}
