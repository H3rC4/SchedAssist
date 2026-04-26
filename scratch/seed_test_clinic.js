const { createClient } = require('@supabase/supabase-js');
const { addDays, addHours, startOfHour, format, parseISO, setHours, setMinutes } = require('date-fns');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // USAR SERVICE ROLE PARA CREAR USUARIOS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function seed() {
  console.log('--- INICIANDO SEEDING DE CLÍNICA DE PRUEBA ---');

  // 1. Crear Tenant
  const tenantSlug = `test-clinic-${Date.now()}`;
  const { data: tenant, error: tErr } = await supabase
    .from('tenants')
    .insert({
      name: 'Clínica de Prueba Antigravity 2026',
      slug: tenantSlug,
      timezone: 'America/Argentina/Buenos_Aires',
      settings: {
        language: 'es',
        waitlist_auto_notify: true,
        waitlist_offer_timeout_minutes: 1440
      }
    })
    .select()
    .single();

  if (tErr) {
    console.error('Error creando tenant:', tErr);
    return;
  }
  console.log(`✅ Tenant creado: ${tenant.name} (${tenant.id})`);

  // 2. Crear Usuario Admin en Auth
  const adminEmail = `admin-${Date.now()}@test.com`;
  const adminPass = 'TestClinic2026!';
  
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPass,
    email_confirm: true
  });

  if (authErr) {
    console.error('Error creando usuario auth:', authErr);
    return;
  }
  const userId = authData.user.id;
  console.log(`✅ Usuario Auth creado: ${adminEmail}`);

  // 3. Vincular Usuario con Tenant
  await supabase.from('tenant_users').insert({
    tenant_id: tenant.id,
    user_id: userId,
    role: 'tenant_admin'
  });
  console.log('✅ Usuario vinculado como tenant_admin.');

  // 4. Crear Servicios
  const servicesData = [
    { name: 'Consulta General', duration_minutes: 30, price: 5000, active: true, tenant_id: tenant.id },
    { name: 'Limpieza Dental', duration_minutes: 60, price: 8000, active: true, tenant_id: tenant.id }
  ];
  const { data: services } = await supabase.from('services').insert(servicesData).select();
  console.log(`✅ Servicios creados.`);

  // 5. Crear Profesionales
  const profsData = [
    { full_name: 'Dr. Test Antigravity', specialty: 'General', active: true, tenant_id: tenant.id }
  ];
  const { data: professionals } = await supabase.from('professionals').insert(profsData).select();
  console.log(`✅ Profesional creado.`);

  // 6. Crear Clientes
  const clientsData = [
    { first_name: 'Paciente', last_name: 'Prueba', phone: '5491112345678', tenant_id: tenant.id }
  ];
  const { data: clients } = await supabase.from('clients').insert(clientsData).select();
  console.log(`✅ Cliente creado.`);

  // 7. Crear Citas
  const now = new Date();
  const start = setHours(setMinutes(addDays(now, 1), 0), 10);
  await supabase.from('appointments').insert({
    tenant_id: tenant.id,
    professional_id: professionals[0].id,
    service_id: services[0].id,
    client_id: clients[0].id,
    status: 'confirmed',
    source: 'dashboard',
    start_at: start.toISOString(),
    end_at: addHours(start, 1).toISOString()
  });
  
  // Cita para 2027
  const nextYear = addDays(now, 400);
  await supabase.from('appointments').insert({
    tenant_id: tenant.id,
    professional_id: professionals[0].id,
    service_id: services[0].id,
    client_id: clients[0].id,
    status: 'confirmed',
    source: 'dashboard',
    start_at: nextYear.toISOString(),
    end_at: addHours(nextYear, 1).toISOString(),
    notes: 'Cita en 2027'
  });

  console.log('✅ Citas creadas (incluyendo 2027).');

  console.log('\n--- DATOS DE ACCESO ---');
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPass}`);
  console.log(`URL Dashboard: /dashboard`);
  console.log(`Slug Clínica: ${tenantSlug}`);
}

seed();
