import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { format, subDays, addDays, setHours, setMinutes } from 'date-fns';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const email = 'prueba@test.com';
  const password = 'test123';
  const clinicName = 'Clinica Prueba';
  const clinicSlug = 'clinica-prueba';

  console.log(`\n🚀 Setting up Test Clinic: ${clinicName}`);

  // 1. Create or Get Tenant
  let { data: tenant } = await supabase.from('tenants').select('*').eq('slug', clinicSlug).single();
  if (!tenant) {
    const { data: newTenant, error: tErr } = await supabase.from('tenants').insert([{
      name: clinicName,
      slug: clinicSlug,
      timezone: 'UTC',
      settings: { language: 'en', currency: 'USD' }
    }]).select().single();
    if (tErr) throw tErr;
    tenant = newTenant;
    console.log('✅ Tenant created');
  } else {
    console.log('ℹ️ Tenant already exists');
  }

  // 2. Auth User
  const { data: usersData } = await supabase.auth.admin.listUsers();
  let existingUser = usersData?.users.find(u => u.email === email);
  let userId = existingUser?.id;

  if (!existingUser) {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError) throw authError;
    userId = authUser.user.id;
    console.log('✅ Auth user created');
  } else {
    console.log('ℹ️ Auth user exists');
  }

  // 3. Link
  const { data: link } = await supabase.from('tenant_users').select('*').eq('tenant_id', tenant.id).eq('user_id', userId).single();
  if (!link) {
    await supabase.from('tenant_users').insert([{ tenant_id: tenant.id, user_id: userId, role: 'tenant_admin' }]);
  }

  // 4. CLEANUP EXISTING DATA FOR THIS TENANT
  console.log('🧹 Cleaning up old data for this tenant...');
  await supabase.from('appointments').delete().eq('tenant_id', tenant.id);
  await supabase.from('clients').delete().eq('tenant_id', tenant.id);
  await supabase.from('professionals').delete().eq('tenant_id', tenant.id);
  await supabase.from('services').delete().eq('tenant_id', tenant.id);

  // 5. Insert New Data
  const servicesData = [
    { name: 'General Consultation', duration_minutes: 30, price: 50, active: true, tenant_id: tenant.id },
    { name: 'Specialist Visit', duration_minutes: 45, price: 120, active: true, tenant_id: tenant.id },
    { name: 'Emergency Care', duration_minutes: 60, price: 200, active: true, tenant_id: tenant.id }
  ];
  const { data: services } = await supabase.from('services').insert(servicesData).select();
  console.log('✅ Services created');

  const prosData = [
    { full_name: 'Dr. Michael Scott', specialty: 'General Medicine', active: true, tenant_id: tenant.id },
    { full_name: 'Dr. Pam Beesly', specialty: 'Dermatology', active: true, tenant_id: tenant.id }
  ];
  const { data: pros } = await supabase.from('professionals').insert(prosData).select();
  console.log('✅ Professionals created');

  const clientsData = Array.from({ length: 15 }).map((_, i) => ({
    first_name: `TestClient${i}`,
    last_name: 'Simulated',
    phone: `+12345678${i}`,
    tenant_id: tenant.id
  }));
  const { data: clients } = await supabase.from('clients').insert(clientsData).select();
  console.log('✅ Clients created');

  // 6. Appointments
  console.log('⏳ Generating 50+ appointments...');
  const appointmentsPayload = [];
  const statuses = ['completed', 'pending', 'cancelled', 'confirmed'];

  for (let i = 0; i < 7; i++) {
    const date = subDays(new Date(), i);
    const count = Math.floor(Math.random() * 5) + 4;
    for (let j = 0; j < count; j++) {
      const startAt = setHours(setMinutes(date, Math.random() * 60), 9 + j);
      appointmentsPayload.push({
        tenant_id: tenant.id,
        client_id: clients![Math.floor(Math.random() * clients!.length)].id,
        professional_id: pros![Math.floor(Math.random() * pros!.length)].id,
        service_id: services![Math.floor(Math.random() * services!.length)].id,
        status: i === 0 ? 'pending' : statuses[Math.floor(Math.random() * statuses.length)],
        start_at: startAt.toISOString(),
        end_at: startAt.toISOString(),
        source: 'dashboard'
      });
    }
  }

  const { error: appError } = await supabase.from('appointments').insert(appointmentsPayload);
  if (appError) console.error('Error inserting apps:', appError);
  console.log('✅ Appointments generated');

  console.log('\n✨ SEEDING COMPLETE');
  console.log(`Email: ${email} / Pass: ${password}\n`);
}

main().catch(console.error);
