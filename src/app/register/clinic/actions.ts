'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getCountryConfig } from '@/lib/country-config';

export async function createClinicAction(formData: FormData) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No estás autenticado.' };
  }

  const clinicName = formData.get('clinicName') as string;
  const country = formData.get('country') as string || 'ES';
  const language = formData.get('language') as string || 'es';
  const contactPhone = formData.get('contactPhone') as string || '';

  if (!clinicName) {
    return { error: 'El nombre de la clínica es obligatorio.' };
  }

  // Get country configuration
  const countryConfig = getCountryConfig(country);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Create the tenant with country and timezone
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: clinicName,
        slug: `${clinicName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`,
        timezone: countryConfig.timezone,
        subscription_status: 'trialing',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        settings: { 
          language, 
          contact_phone: contactPhone, 
          default_country_code: countryConfig.countryCode 
        }
      })
      .select('id')
      .single();

    if (tenantError) throw tenantError;

    // 2. Link the user to the tenant
    const { error: linkError } = await supabaseAdmin
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        role: 'tenant_admin'
      });

    if (linkError) throw linkError;

    // 3. Crear sede por defecto con el nombre de la clínica
    await supabaseAdmin
      .from('locations')
      .insert({
        tenant_id: tenant.id,
        name: clinicName,
        active: true
      });

    // Redirigir al inicio para iniciar OnboardingWizard
    return { success: true };
    
  } catch (err: any) {
    console.error('Error creating clinic:', err);
    return { error: err.message || 'Error al crear la clínica.' };
  }
}
