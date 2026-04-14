import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const errorParam = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (errorParam) {
    console.error('Supabase Auth URL Error:', errorParam, errorDescription)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(errorDescription || errorParam)}`)
  }

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const projectRef = supabaseUrl.split('.')[0].split('//')[1] || 'unknown'
    const supabase = await createClient()
    try {
      const cookieStore = cookies()
      const verifier = cookieStore.get(`sb-${projectRef}-auth-token-code-verifier`)
      console.log('Project Ref:', projectRef, 'Verifier Cookie Found:', !!verifier)
      
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      }
      
      const loggerStore = cookies()
      const allCookies = loggerStore.getAll()
      const cookieNames = allCookies.map(c => c.name).join(', ')
      console.error('OAuth Exchange Error:', error.message, 'ProjectRef:', projectRef, 'Cookie Names:', cookieNames);
      
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error.message + ' (Ref: ' + projectRef + ', Cookies: ' + cookieNames + ')')}`)
    } catch (e) {
      console.error('Unexpected Auth Error:', e)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=Unexpected_Auth_Error`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/login?error=Invalid_OAuth_Request_No_Code`)
}
