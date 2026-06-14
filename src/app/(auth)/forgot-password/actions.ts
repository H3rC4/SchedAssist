'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { EmailService } from '@/services/email.service'
import crypto from 'crypto'

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    return redirect(`/forgot-password?error=${encodeURIComponent('Please enter your email address.')}`)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('tenant_users')
      .select('user_id, tenants(name)')
      .eq('users.email', email)
      .single()

    if (userError || !userData) {
      // Don't reveal whether email exists or not for security
      return redirect(`/forgot-password?success=true`)
    }

    // Generate reset token and store it
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Token expires in 1 hour
    
    // Store password reset token
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert([
        {
          user_id: userData.user_id,
          token: resetToken,
          expires_at: expiresAt.toISOString()
        }
      ])
    
    if (tokenError) throw tokenError
    
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}api/auth/reset-password/${resetToken}`

    // Send password reset email
    await EmailService.sendPasswordResetEmail(
      email,
      Array.isArray(userData.tenants) && userData.tenants.length > 0 
        ? userData.tenants[0].name 
        : 'SchedAssist',
      resetLink,
      {}
    )

    return redirect(`/forgot-password?success=true`)
  } catch (error: any) {
    console.error('Password reset request error:', error)
    return redirect(`/forgot-password?error=${encodeURIComponent(error.message || 'Error processing request.')}`)
  }
}
