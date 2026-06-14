'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import * as otplib from 'otplib'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

// Robust authenticator instance selection
const auth: any = (otplib as any).authenticator || (otplib as any).default?.authenticator || otplib;

const ISSUER = 'SchedAssist'

function getAdminClient() {
  return createAdminClient()
}

function getServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options })
            )
          } catch (error) {
            // Se puede ignorar en Server Actions
          }
        },
      },
    }
  )
}

export async function checkEnrollmentAction() {
  const supabaseAdmin = getAdminClient()
  const supabase = getServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { enrolled: false, error: 'User not found in session' }

  // Check app_metadata for secret
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user.id)
  const secret = userData.user?.app_metadata?.sa_2fa_secret

  if (!secret) {
    // Generate new secret for first time
    // We use a safe way to generate secret if authenticator is not fully loaded
    const newSecret = auth.generateSecret ? auth.generateSecret() : crypto.randomBytes(5).toString('hex').toUpperCase();
    
    // Manual OTPAuth URI construction to avoid 'split' errors in otplib internal methods
    const label = encodeURIComponent(user.email!)
    const issuer = encodeURIComponent(ISSUER)
    const otpauth = `otpauth://totp/${issuer}:${label}?secret=${newSecret}&issuer=${issuer}&digits=6&period=30`
    
    return { enrolled: false, secret: newSecret, otpauth }
  }

  return { enrolled: true }
}

export async function enroll2faAction(secret: string, code: string) {
  const supabaseAdmin = getAdminClient()
  const supabase = getServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Verify code
  const result = auth.verifySync ? auth.verifySync({ token: code, secret }) : { valid: false }
  if (!result.valid) return { error: 'Código inválido. Intenta de nuevo.' }

  // Save secret in app_metadata
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    app_metadata: { sa_2fa_secret: secret }
  })

  if (error) return { error: error.message }

  // Set verification cookie - persist for 24 hours
  cookies().set('sa_2fa_verified', 'true', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours
  })

  return { success: true }
}

export async function verify2faAction(code: string) {
  const supabaseAdmin = getAdminClient()
  const supabase = getServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user.id)
  const secret = userData.user?.app_metadata?.sa_2fa_secret

  if (!secret) return { error: '2FA no configurado' }

  const result = auth.verifySync ? auth.verifySync({ token: code, secret }) : { valid: false }
  if (!result.valid) return { error: 'Código incorrecto' }

  // Set verification cookie - persist for 24 hours
  cookies().set('sa_2fa_verified', 'true', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours
  })

  return { success: true }
}
