import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { SUPERADMIN_EMAILS } from '@/lib/constants'

export async function middleware(request: NextRequest) {
  // --- RATE LIMITING con Upstash Redis ---
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

  // Determinar tipo de rate limit según el path
  const isAuthEndpoint =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/forgot-password') ||
    request.nextUrl.pathname.startsWith('/reset-password') ||
    request.nextUrl.pathname.startsWith('/api/auth/')

  const rateLimitType = isAuthEndpoint ? 'auth' : 'general'
  const rateLimitResult = await checkRateLimit(ip, rateLimitType)

  if (rateLimitResult.blocked) {
    return rateLimitResult.response
  }

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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
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

  const userEmail = (user?.email || '').toLowerCase().trim()
  const isSuperAdmin = SUPERADMIN_EMAILS.includes(userEmail)

  // Protect /superadmin - only superadmins
  const UNPROTECTED_SUPERADMIN = ['/superadmin/reset-password', '/superadmin/2fa'];
  if (request.nextUrl.pathname.startsWith('/superadmin') && 
      !UNPROTECTED_SUPERADMIN.some(p => request.nextUrl.pathname.startsWith(p))) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (!isSuperAdmin) {
      // LOG: Unauthorized access attempt to superadmin
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

    // Role-based restrictions for dashboard
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (tenantUser?.role === 'secretary') {
        const restrictedPaths = ['/dashboard/analytics', '/dashboard/settings', '/dashboard/dashboard']
        const isRestricted = restrictedPaths.some(p => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(p))
        const isRootDashboard = request.nextUrl.pathname === '/dashboard' || request.nextUrl.pathname === '/dashboard/'
        
        if (isRestricted || isRootDashboard) {
          return NextResponse.redirect(new URL('/dashboard/appointments', request.url))
        }
      }
    }
  }

  // Protect /doctor routes - require login
  if (request.nextUrl.pathname.startsWith('/doctor')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Redirect from public routes to dashboard if logged in
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login') {
    if (user) {
      if (isSuperAdmin) {
        return NextResponse.redirect(new URL('/superadmin', request.url))
      }
      
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('role')
        .eq('user_id', user.id)
        .single()
        
      if (tenantUser?.role === 'professional') {
        return NextResponse.redirect(new URL('/doctor', request.url))
      }
      if (tenantUser?.role === 'secretary') {
        return NextResponse.redirect(new URL('/dashboard/appointments', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // --- SECURITY HEADERS ---
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

