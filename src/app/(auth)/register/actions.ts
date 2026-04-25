'use server';

import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export async function registerAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const clinicName = formData.get('clinicName') as string;
  const language = formData.get('language') as string || 'es';

  if (!email || !password || !clinicName) {
    return { error: 'Por favor completa todos los campos.' };
  }

  // Clientes Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  // Usamos el cliente con Service Role para crear el tenant sin restricciones de RLS iniciales
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const supabaseLocal = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 1. Crear el usuario en Auth
    const { data: authData, error: authError } = await supabaseLocal.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/login?confirmed=true`
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No se pudo crear el usuario.');

    const userId = authData.user.id;
    const slug = clinicName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    // Calcular fin de prueba (7 días)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    // 2. Crear el Tenant (Clínica) con estado 'trial'
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

    // 3. Vincular usuario con el Tenant como Admin
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

    // 4. Todo bien. Devolver éxito para que el frontend inicie el checkout
    return { success: true };
    
  } catch (err: any) {
    console.error('Registration error:', err);
    return { error: err.message || 'Error al crear la cuenta.' };
  }
}
