'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const supabase = await createClient()

  if (password !== confirmPassword) {
    return redirect(`/reset-password?error=${encodeURIComponent('Las contraseñas no coinciden')}`)
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return redirect(`/reset-password?error=${encodeURIComponent(error.message)}`)
  }

  // Password reset successful, sign out and redirect to login
  await supabase.auth.signOut()
  return redirect('/login?success=Tu contraseña ha sido actualizada con éxito')
}
