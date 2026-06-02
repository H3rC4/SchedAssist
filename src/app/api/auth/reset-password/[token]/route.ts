import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token;
    const formData = await request.formData();
    const password = formData.get('password') as string;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and new password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Look up the token in password_reset_tokens table
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('user_id, used, expires_at')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // 2. Check if token is already used
    if (tokenData.used) {
      return NextResponse.json(
        { error: 'Reset token has already been used' },
        { status: 400 }
      );
    }

    // 3. Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    // 4. Update the user's password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: password }
    );

    if (updateError) throw updateError;

    // 5. Mark the token as used
    const { error: markUsedError } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token);

    if (markUsedError) throw markUsedError;

    // Redirect to login with success message
    return NextResponse.redirect(new URL('/login?reset=true', request.url));
    
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message || 'Reset failed')}`, request.url));
  }
}