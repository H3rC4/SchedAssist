'use server';

import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export async function registerAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const clinicName = formData.get('clinicName') as string;
  const language = formData.get('language') as string || 'es';

  if (!email || !password || !clinicName) {
    return { error: 'Please complete all fields.' };
  }

  // Supabase clients
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
   
  // Use service role client to create tenant without initial RLS restrictions
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const supabaseLocal = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 1. Create the user in Auth (email not confirmed initially)
    const { data: authData, error: authError } = await supabaseLocal.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: clinicName
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user.');

    const userId = authData.user.id;
    const slug = clinicName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
     
    // Calculate trial end (14 days)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // 2. Create the Tenant (Clinic) with 'trial' status
    const { data: tenant, error: tenantError } = await supabaseAdmin
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
    const { error: linkError } = await supabaseAdmin
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
    await supabaseAdmin
      .from('locations')
      .insert([
        {
          tenant_id: tenant.id,
          name: clinicName,
          active: true
        }
      ]);

    // 5. Return success - email verification will be handled by our custom endpoints
    return { success: true };
    
  } catch (err: any) {
    console.error('Registration error:', err);
    return { error: err.message || 'Error creating account.' };
  }
}
