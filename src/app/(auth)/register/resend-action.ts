'use server';

import { createClient } from '@supabase/supabase-js';
import { EmailService } from '@/services/email.service';
import { buildAppUrl } from '@/lib/utils';
import crypto from 'crypto';

export async function resendVerificationEmailAction(formData: FormData) {
  const email = formData.get('email') as string;
  const clinicName = formData.get('clinicName') as string || 'SchedAssist';
  const language = formData.get('language') as string || 'es';

  if (!email) {
    return { error: 'Email is required.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Find user by email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const user = existingUsers?.users?.find(u => u.email === email);

    if (!user) {
      return { error: 'No account found with that email address.' };
    }

    if (user.email_confirmed_at) {
      return { error: 'This email address is already verified. Please log in.' };
    }

    const userId = user.id;

    // Try to find an existing unused token
    const { data: existingToken } = await supabaseAdmin
      .from('email_verification_tokens')
      .select('token, expires_at, used')
      .eq('user_id', userId)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let verificationToken: string;

    if (existingToken && new Date(existingToken.expires_at) > new Date()) {
      verificationToken = existingToken.token;
    } else {
      // Generate a new token
      verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date();
      tokenExpires.setHours(tokenExpires.getHours() + 24);

      const { error: tokenError } = await supabaseAdmin
        .from('email_verification_tokens')
        .insert({
          user_id: userId,
          token: verificationToken,
          expires_at: tokenExpires.toISOString()
        });

      if (tokenError) throw tokenError;
    }

    const verificationLink = buildAppUrl(`/api/auth/verify-email/${verificationToken}`);

    const emailResult = await EmailService.sendVerificationEmail(
      email,
      clinicName,
      verificationLink,
      { language, specialty: 'Medicina General' }
    );

    if (!emailResult.success) {
      console.error('Failed to resend verification email:', emailResult.error);
      return { error: emailResult.error || 'Could not send verification email. Please try again later.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Resend verification email error:', err);
    return { error: err.message || 'Error resending verification email.' };
  }
}
