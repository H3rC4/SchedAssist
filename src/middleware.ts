import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const SUPERADMIN_EMAILS = ['hernanenriquecaballero@gmail.com']

  // Protect /superadmin - only superadmins (except recovery pages and 2fa verification)
  const UNPROTECTED_SUPERADMIN = ['/superadmin/reset-password', '/superadmin/2fa'];
  if (request.nextUrl.pathname.startsWith('/superadmin') && 
      !UNPROTECTED_SUPERADMIN.some(p => request.nextUrl.pathname.startsWith(p))) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const userEmail = session.user.email || ''
    if (!SUPERADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Require 2FA verification for superadmin access
    const is2faVerified = request.cookies.get('sa_2fa_verified')?.value === 'true'
    if (!is2faVerified) {
      return NextResponse.redirect(new URL('/superadmin/2fa', request.url))
    }
  }

  // Protect /dashboard and /register/clinic routes
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/register/clinic')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const userEmail = session.user.email || ''
    if (SUPERADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.redirect(new URL('/superadmin', request.url))
    }
  }

  // Redirect from public routes to dashboard if logged in
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login') {
    if (session) {
      const userEmail = session.user.email || ''
      if (SUPERADMIN_EMAILS.includes(userEmail)) {
        return NextResponse.redirect(new URL('/superadmin', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
