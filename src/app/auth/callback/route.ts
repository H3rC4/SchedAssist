import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const supabase = await createClient()
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      }
      
      console.error('OAuth Exchange Error:', error)
      // PKCE errors usually mean the storage is missing the verifier
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`)
    } catch (e) {
      console.error('Unexpected Auth Error:', e)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=Unexpected_Auth_Error`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/login?error=Invalid_OAuth_Request_No_Code`)
}
