import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function migrateTenants() {
  console.log('=== Migracion Tenants Existentes ===');
  
  const { data: tenants, error: fetchError } = await supabase
    .from('tenants')
    .select('id')
    .is('plan_tier', null);
  
  if (fetchError) {
    console.error('Error buscando tenants:', fetchError);
    return;
  }
  
  if (!tenants || tenants.length === 0) {
    console.log('No hay tenants sin plan_tier. Migracion de tenants completada.');
    return;
  }
  
  console.log(`Encontrados ${tenants.length} tenants para migrar a plan Pro...`);
  
  // Update in batches to avoid timeout
  const batchSize = 50;
  for (let i = 0; i < tenants.length; i += batchSize) {
    const batch = tenants.slice(i, i + batchSize).map(t => t.id);
    
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        plan_tier: 'pro',
        payment_gateway: 'stripe',
        billing_cycle: 'monthly',
        max_professionals: 5,
        max_services: -1,
        max_locations: 2,
        max_appointments_per_month: -1,
        max_patients: -1,
        custom_domain_enabled: false,
        white_label_enabled: false,
        api_access_enabled: true,
        analytics_tier: 'advanced',
        whatsapp_numbers_count: 1,
        whatsapp_numbers_limit: 1,
      })
      .in('id', batch);
    
    if (updateError) {
      console.error(`Error actualizando batch ${i}:`, updateError);
    } else {
      console.log(`Batch ${i} - ${Math.min(i + batchSize, tenants.length)} migrado`);
    }
  }
  
  console.log('Migracion de tenants completada.\n');
}

async function seedPlanConfigs() {
  console.log('=== Seed Plan Configs ===');
  
  const plans = [
    {
      tier: 'basic',
      name: 'Starter',
      max_professionals: 1,
      max_services: -1,
      max_locations: 1,
      max_appointments_per_month: 150,
      max_patients: 200,
      custom_domain_enabled: false,
      white_label_enabled: true,
      api_access_enabled: false,
      analytics_tier: 'basic',
      whatsapp_numbers_limit: 0,
    },
    {
      tier: 'pro',
      name: 'Pro',
      max_professionals: 5,
      max_services: -1,
      max_locations: 2,
      max_appointments_per_month: -1,
      max_patients: -1,
      custom_domain_enabled: false,
      white_label_enabled: false,
      api_access_enabled: true,
      analytics_tier: 'advanced',
      whatsapp_numbers_limit: 1,
    },
    {
      tier: 'premium',
      name: 'Premium',
      max_professionals: -1,
      max_services: -1,
      max_locations: -1,
      max_appointments_per_month: -1,
      max_patients: -1,
      custom_domain_enabled: true,
      white_label_enabled: true,
      api_access_enabled: true,
      analytics_tier: 'custom',
      whatsapp_numbers_limit: 1,
    },
  ];
  
  for (const plan of plans) {
    const { error } = await supabase
      .from('plan_configs')
      .upsert(plan, { onConflict: 'tier' });
    
    if (error) {
      console.error(`Error insertando plan ${plan.tier}:`, error);
    } else {
      console.log(`Plan ${plan.tier} configurado.`);
    }
  }
  
  console.log('Seed de plan configs completado.\n');
}

async function main() {
  console.log('=== SEMANA 1: Foundation - Migracion DB ===\n');
  
  // Note: ALTER TABLE y CREATE TABLE deben ejecutarse manualmente en Supabase Dashboard > SQL Editor
  // El archivo migration-plans.sql contiene el SQL completo.
  
  await migrateTenants();
  await seedPlanConfigs();
  
  console.log('=== INSTRUCCIONES PENDIENTES ===');
  console.log('1. Ve a Supabase Dashboard: https://app.supabase.com/project/gtpnikqxhqgoohqqdzhg');
  console.log('2. Abre SQL Editor > New query');
  console.log('3. Abre el archivo: src/scripts/migration-plans.sql');
  console.log('4. Copia y pega TODO el contenido en el SQL Editor');
  console.log('5. Ejecuta el query');
  console.log('\nEsto creara las tablas plan_configs, payments, whatsapp_numbers y los nuevos campos en tenants.');
}

main().catch(console.error);
