'use server'

import { redirect } from 'next/navigation'

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    return redirect(`/forgot-password?error=${encodeURIComponent('Please enter your email address.')}`)
  }

  // Call our custom password reset request endpoint
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/request-reset`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const errorData = await response.json()
    return redirect(`/forgot-password?error=${encodeURIComponent(errorData.error || 'Failed to process request')}`)
  }

  // Our endpoint always returns success (for security - doesn't reveal if email exists)
  return redirect(`/forgot-password?success=true`)
}
