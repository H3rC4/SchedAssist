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
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set({ name, value, ...options }))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set({ name, value, ...options })
          )
        },
      },
    }
  )
  
  // Skip auth check for the callback route to avoid interfering with PKCE flow
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    return response
  }

  // Use getUser() instead of getSession() for more robust auth state checking
  const { data: { user } } = await supabase.auth.getUser()

  const SUPERADMIN_EMAILS = ['hernanenriquecaballero@gmail.com']
  const userEmail = user?.email || ''
  const isSuperAdmin = SUPERADMIN_EMAILS.includes(userEmail)

  // Protect /superadmin - only superadmins
  const UNPROTECTED_SUPERADMIN = ['/superadmin/reset-password', '/superadmin/2fa'];
  if (request.nextUrl.pathname.startsWith('/superadmin') && 
      !UNPROTECTED_SUPERADMIN.some(p => request.nextUrl.pathname.startsWith(p))) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (!isSuperAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    const is2faVerified = request.cookies.get('sa_2fa_verified')?.value === 'true'
    if (!is2faVerified) {
      return NextResponse.redirect(new URL('/superadmin/2fa', request.url))
    }
  }

  // Protect /dashboard and /register/clinic
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/register/clinic')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (isSuperAdmin && !request.nextUrl.pathname.startsWith('/dashboard/pay')) {
      return NextResponse.redirect(new URL('/superadmin', request.url))
    }
  }

  // Redirect from public routes to dashboard if logged in
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login') {
    if (user) {
      if (isSuperAdmin) {
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

