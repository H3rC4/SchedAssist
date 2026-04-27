const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getLastTestClinic() {
  // 1. Obtener el último tenant creado
  const { data: tenant, error: tErr } = await supabase
    .from('tenants')
    .select('id, name, slug, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (tErr) {
    console.error('Error obteniendo tenant:', tErr);
    return;
  }

  // 2. Obtener el usuario admin vinculado
  const { data: tenantUser, error: tuErr } = await supabase
    .from('tenant_users')
    .select('user_id')
    .eq('tenant_id', tenant.id)
    .eq('role', 'tenant_admin')
    .single();

  if (tuErr) {
    console.error('Error obteniendo tenant_user:', tuErr);
    return;
  }

  // 3. Obtener el email del usuario desde auth (usando admin API)
  const { data: authUser, error: auErr } = await supabase.auth.admin.getUserById(tenantUser.user_id);

  if (auErr) {
    console.error('Error obteniendo usuario auth:', auErr);
    return;
  }

  console.log('\n--- DATOS DE LA ÚLTIMA CLÍNICA ---');
  console.log(`Nombre: ${tenant.name}`);
  console.log(`Slug: ${tenant.slug}`);
  console.log(`Email Admin: ${authUser.user.email}`);
  console.log(`Contraseña: TestClinic2026! (por defecto del script)`);
  console.log(`ID Tenant: ${tenant.id}`);
  console.log('----------------------------------\n');
}

getLastTestClinic();
