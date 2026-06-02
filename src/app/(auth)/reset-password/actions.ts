'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const token = formData.get('token') as string
  
  if (password !== confirmPassword) {
    return redirect(`/reset-password?error=${encodeURIComponent('Passwords do not match')}&token=${token}`)
  }
  
  if (password.length < 6) {
    return redirect(`/reset-password?error=${encodeURIComponent('Password must be at least 6 characters long')}&token=${token}`)
  }
  
  if (!token) {
    return redirect(`/reset-password?error=${encodeURIComponent('Invalid request - missing token')}`)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 1. Look up the token in password_reset_tokens table
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('user_id, used, expires_at')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      return redirect(`/reset-password?error=${encodeURIComponent('Invalid or expired reset token')}`)
    }

    // 2. Check if token is already used
    if (tokenData.used) {
      return redirect(`/reset-password?error=${encodeURIComponent('Reset token has already been used')}`)
    }

    // 3. Check if token is expired
    const expiresAt = new Date(tokenData.expires_at)
    if (expiresAt < new Date()) {
      return redirect(`/reset-password?error=${encodeURIComponent('Reset token has expired')}`)
    }

    // 4. Update the user's password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: password }
    )

    if (updateError) throw updateError

    // 5. Mark the token as used
    const { error: markUsedError } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token)

    if (markUsedError) throw markUsedError

    // Redirect to login with success message
    return redirect('/login?reset=true')
  } catch (error: any) {
    console.error('Password reset error:', error)
    return redirect(`/reset-password?error=${encodeURIComponent(error.message || 'Failed to reset password')}&token=${token}`)
  }
}
