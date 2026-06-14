import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { EmailService } from '@/services/email.service';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const clinicName = formData.get('clinicName') as string;
    const language = formData.get('language') as string || 'es';

    if (!email || !password || !clinicName) {
      return NextResponse.json(
        { error: 'Please complete all fields.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Create the user in Auth (with email not confirmed initially)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email verification
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user.');

    const userId = authData.user.id;
    const slug = clinicName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    // Calculate trial end (14 days)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // 2. Create the Tenant (Clinic) with 'trial' status
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert([
        {
          name: clinicName,
          slug,
          subscription_status: 'trial',
          trial_ends_at: trialEndsAt.toISOString(),
          settings: {
            language: language,
            specialty: 'Medicina General'
          }
        }
      ])
      .select()
      .single();

    if (tenantError) throw tenantError;

    // 3. Link user with the Tenant as Admin
    const { error: linkError } = await supabase
      .from('tenant_users')
      .insert([
        {
          tenant_id: tenant.id,
          user_id: userId,
          role: 'tenant_admin'
        }
      ]);

    if (linkError) throw linkError;

    // 4. Create default location with clinic name
    await supabase
      .from('locations')
      .insert([
        {
          tenant_id: tenant.id,
          name: clinicName,
          active: true
        }
      ]);

    // 5. Generate verification token and store it
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours
    
    // Store verification token
    const { error: tokenError } = await supabase
      .from('email_verification_tokens')
      .insert([
        {
          user_id: userId,
          token: verificationToken,
          expires_at: expiresAt.toISOString()
        }
      ]);
    
    if (tokenError) throw tokenError;
    
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email/${verificationToken}`;

    // Send verification email
    await EmailService.sendVerificationEmail(
      email,
      clinicName,
      verificationLink,
      {
        language: language,
        specialty: 'Medicina General'
      }
    );

    return NextResponse.json({ 
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.'
    });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Error creating account.' },
      { status: 500 }
    );
  }
}