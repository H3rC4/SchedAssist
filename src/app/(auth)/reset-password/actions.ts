'use server'

import { redirect } from 'next/navigation'

export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  
  if (password !== confirmPassword) {
    return redirect(`/reset-password?error=${encodeURIComponent('Passwords do not match')}`)
  }
  
  if (password.length < 6) {
    return redirect(`/reset-password?error=${encodeURIComponent('Password must be at least 6 characters long')}`)
  }
  
  // Extract token from URL (this would normally come from the route params, but in server action we need to get it differently)
  // For now, we'll rely on the frontend to pass it or we'll need to modify the approach
  // Let's get it from referer or assume it's handled by the route
  
  // Since we're in a server action, we don't have direct access to URL params
  // We'll need to pass the token in the formData or handle this differently
  // For simplicity, let's assume the token is passed in a hidden field
  const token = formData.get('token') as string
  
  if (!token) {
    return redirect(`/reset-password?error=${encodeURIComponent('Invalid request - missing token')}`)
  }
  
  // Call our custom reset password endpoint
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/reset-password/${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      password: password
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    return redirect(`/reset-password?error=${encodeURIComponent(errorData.error || 'Failed to reset password')}&token=${token}`)
  }
  
  // Redirect to login with success message
  return redirect('/login?reset=true')
}
