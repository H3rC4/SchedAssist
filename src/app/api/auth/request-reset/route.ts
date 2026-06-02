import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { EmailService } from '@/services/email.service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;

    if (!email) {
      return NextResponse.json(
        { error: 'Please enter your email address.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('tenant_users')
      .select('user_id, tenants(name)')
      .eq('users.email', email)
      .single();

    if (userError || !userData) {
      // Don't reveal whether email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, you will receive reset instructions.'
      });
    }

    // Generate reset token and store it
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour
    
    // Store password reset token
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert([
        {
          user_id: userData.user_id,
          token: resetToken,
          expires_at: expiresAt.toISOString()
        }
      ]);
    
    if (tokenError) throw tokenError;
    
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${resetToken}`;

    // Send password reset email
    await EmailService.sendPasswordResetEmail(
      email,
      Array.isArray(userData.tenants) && userData.tenants.length > 0 
        ? userData.tenants[0].name 
        : 'Unknown Tenant',
      resetLink,
      {} // tenant settings would be fetched in a real implementation
    );

    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, you will receive reset instructions.'
    });
    
  } catch (error: any) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing request.' },
      { status: 500 }
    );
  }
}