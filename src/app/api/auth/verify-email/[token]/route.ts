import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token;
    
    if (!token) {
      return NextResponse.redirect(new URL('/login?error=Invalid verification token', request.url));
    }
    
    const supabase = createAdminClient();
    
    // 1. Look up the token in verification_tokens table
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('user_id, used, expires_at')
      .eq('token', token)
      .single();
    
    if (tokenError || !tokenData) {
      return NextResponse.redirect(new URL('/login?error=Invalid or expired verification token', request.url));
    }
    
    // 2. Check if token is already used
    if (tokenData.used) {
      return NextResponse.redirect(new URL('/login?error=Verification token has already been used', request.url));
    }
    
    // 3. Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.redirect(new URL('/login?error=Verification token has expired', request.url));
    }
    
    // 4. Mark the user's email as confirmed in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { email_confirm: true }
    );
    
    if (updateError) throw updateError;
    
    // 5. Mark the token as used
    const { error: markUsedError } = await supabase
      .from('email_verification_tokens')
      .update({ used: true })
      .eq('token', token);
    
    if (markUsedError) throw markUsedError;
    
    // Redirect to login with success message
    return NextResponse.redirect(new URL('/login?verified=true', request.url));
    
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message || 'Verification failed')}`, request.url));
  }
}