'use server';

import { createClient } from '@supabase/supabase-js';
import { EmailService } from '@/services/email.service';

export async function registerAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const clinicName = formData.get('clinicName') as string;
  const language = formData.get('language') as string || 'es';

  if (!email || !password || !clinicName) {
    return { error: 'Please complete all fields.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Track created resources for rollback on failure
  let createdUserId: string | null = null;
  let createdTenantId: string | null = null;

  try {
    // ─── PHASE 1: CLEANUP ORPHANED DATA ───────────────────────────
    // Check if user already exists from a previous failed attempt
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      createdUserId = existingUser.id;

      // Find and delete any tenant linked to this orphaned user
      const { data: orphanedLinks } = await supabaseAdmin
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', existingUser.id);

      if (orphanedLinks && orphanedLinks.length > 0) {
        for (const link of orphanedLinks) {
          // Delete locations, services, professionals, appointments for this tenant
          await supabaseAdmin.from('locations').delete().eq('tenant_id', link.tenant_id);
          await supabaseAdmin.from('services').delete().eq('tenant_id', link.tenant_id);
          await supabaseAdmin.from('professionals').delete().eq('tenant_id', link.tenant_id);
          await supabaseAdmin.from('tenant_users').delete().eq('tenant_id', link.tenant_id);
          await supabaseAdmin.from('tenants').delete().eq('id', link.tenant_id);
        }
      }

      // Delete the orphaned auth user
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      createdUserId = null;
    }

    // ─── PHASE 2: CREATE USER IN AUTH ─────────────────────────────
    // Use admin client to create user with email_confirm: false
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name: clinicName
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user.');

    createdUserId = authData.user.id;
    const userId = authData.user.id;

    // ─── PHASE 3: CREATE TENANT ──────────────────────────────────
    const slug = clinicName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: clinicName,
        slug,
        subscription_status: 'trial',
        plan_tier: 'basic',
        trial_ends_at: trialEndsAt.toISOString(),
        max_professionals: 1,
        max_services: -1,
        max_locations: 1,
        max_appointments_per_month: 150,
        max_patients: 200,
        settings: {
          language: language,
          specialty: 'Medicina General'
        }
      })
      .select()
      .single();

    if (tenantError) throw tenantError;
    createdTenantId = tenant.id;

    // ─── PHASE 4: LINK USER TO TENANT ────────────────────────────
    const { error: linkError } = await supabaseAdmin
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        user_id: userId,
        role: 'tenant_admin'
      });

    if (linkError) throw linkError;

    // ─── PHASE 5: CREATE DEFAULT LOCATION ─────────────────────────
    const { error: locationError } = await supabaseAdmin
      .from('locations')
      .insert({
        tenant_id: tenant.id,
        name: clinicName,
        active: true
      });

    if (locationError) throw locationError;

    // ─── PHASE 6: GENERATE VERIFICATION TOKEN ─────────────────────
    const verificationToken = Math.random().toString(36).substring(2, 15) +
                              Math.random().toString(36).substring(2, 15);
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

    // ─── PHASE 7: SEND VERIFICATION EMAIL ──────────────────────────
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}api/auth/verify-email/${verificationToken}`;
    
    const emailResult = await EmailService.sendVerificationEmail(
      email,
      clinicName,
      verificationLink,
      { language, specialty: 'Medicina General' }
    );

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Don't fail registration if email fails - user can request resend later
    }

    // ─── ALL DONE ─────────────────────────────────────────────────
    return { success: true };

  } catch (err: any) {
    console.error('Registration error:', err);

    // ─── ROLLBACK: Clean up any created resources ─────────────────
    if (createdUserId) {
      try {
        // Delete tenant links and tenant if exists
        if (createdTenantId) {
          await supabaseAdmin.from('locations').delete().eq('tenant_id', createdTenantId);
          await supabaseAdmin.from('services').delete().eq('tenant_id', createdTenantId);
          await supabaseAdmin.from('professionals').delete().eq('tenant_id', createdTenantId);
          await supabaseAdmin.from('tenant_users').delete().eq('tenant_id', createdTenantId);
          await supabaseAdmin.from('tenants').delete().eq('id', createdTenantId);
        }
        // Delete the auth user
        await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      } catch (rollbackErr) {
        console.error('Rollback failed:', rollbackErr);
      }
    }

    return { error: err.message || 'Error creating account.' };
  }
}
