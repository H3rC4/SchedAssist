import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setup() {
  const email = 'hernan@gmail.com';
  const password = '1234';
  const clinicName = 'Clinica Hero';
  const clinicSlug = 'clinica-hero';

  console.log(`Starting setup for ${clinicName}...`);

  // 1. Find or Create Tenant
  let { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', clinicSlug)
    .single();

  if (!tenant) {
    const { data: newTenant, error: createError } = await supabase
      .from('tenants')
      .insert([{ 
        name: clinicName, 
        slug: clinicSlug, 
        timezone: 'America/Argentina/Buenos_Aires',
        settings: {} 
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating tenant:', createError);
      return;
    }
    tenant = newTenant;
    console.log(`Tenant created: ${tenant.id}`);
  } else {
    console.log(`Tenant already exists: ${tenant.id}`);
  }

  // 2. Find or Create Auth User
  let userId: string;
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  const existingUser = users?.users.find(u => u.email === email);

  if (!existingUser) {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }
    userId = authUser.user.id;
    console.log(`Auth user created: ${userId}`);
  } else {
    userId = existingUser.id;
    console.log(`Auth user already exists: ${userId}`);
  }

  // 3. Link User to Tenant (Tenant Admin)
  const { data: existingLink } = await supabase
    .from('tenant_users')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('user_id', userId)
    .single();

  if (!existingLink) {
    const { error: linkError } = await supabase
      .from('tenant_users')
      .insert([{
        tenant_id: tenant.id,
        user_id: userId,
        role: 'tenant_admin'
      }]);

    if (linkError) {
      console.error('Error linking user to tenant:', linkError);
      return;
    }
    console.log(`User linked to tenant as admin.`);
  } else {
    console.log('User already linked to tenant.');
  }

  // 4. Create Professional Profile
  const { data: existingProf } = await supabase
    .from('professionals')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('user_id', userId)
    .single();

  if (!existingProf) {
    const { error: profError } = await supabase
      .from('professionals')
      .insert([{
        tenant_id: tenant.id,
        user_id: userId,
        full_name: 'Dr. Hernan',
        specialty: 'Dentista',
        active: true
      }]);

    if (profError) {
      console.error('Error creating professional profile:', profError);
      return;
    }
    console.log(`Professional profile created.`);
  } else {
    console.log('Professional profile already exists.');
  }

  console.log('--- SETUP COMPLETED SUCCESSFULLY ---');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

setup();
