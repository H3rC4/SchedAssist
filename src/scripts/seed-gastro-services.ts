import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GASTRO_SLUG = 'gastro-sur';

async function seed() {
  console.log('\n🔬 Seeding servicios del Centro Gastroenterológico...\n');

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('slug', GASTRO_SLUG)
    .single();

  if (!tenant) {
    console.error('❌ Tenant gastro-sur no encontrado. Ejecuta primero: npm run setup:gastro');
    process.exit(1);
  }

  const services = [
    {
      tenant_id: tenant.id,
      name: 'Consulta Gastroenterológica',
      duration_minutes: 30,
      price: 8000,
      active: true,
    },
    {
      tenant_id: tenant.id,
      name: 'Endoscopía Digestiva Alta',
      duration_minutes: 45,
      price: 25000,
      active: true,
    },
    {
      tenant_id: tenant.id,
      name: 'Colonoscopía',
      duration_minutes: 60,
      price: 30000,
      active: true,
    },
    {
      tenant_id: tenant.id,
      name: 'Ecografía Abdominal',
      duration_minutes: 30,
      price: 12000,
      active: true,
    },
    {
      tenant_id: tenant.id,
      name: 'Consulta Hepatológica',
      duration_minutes: 30,
      price: 8000,
      active: true,
    },
    {
      tenant_id: tenant.id,
      name: 'Control H. Pylori',
      duration_minutes: 20,
      price: 5000,
      active: true,
    },
  ];

  // Verificar cuáles ya existen
  const { data: existing } = await supabase
    .from('services')
    .select('name')
    .eq('tenant_id', tenant.id);

  const existingNames = (existing || []).map((s: any) => s.name);
  const toInsert = services.filter(s => !existingNames.includes(s.name));

  if (toInsert.length === 0) {
    console.log('ℹ️  Todos los servicios ya existen. Saltando...');
  } else {
    const { error } = await supabase.from('services').insert(toInsert);
    if (error) {
      console.error('❌ Error insertando servicios:', error);
      process.exit(1);
    }
    console.log(`✅ ${toInsert.length} servicios creados para "${tenant.name}":`);
    toInsert.forEach(s => console.log(`   • ${s.name} (${s.duration_minutes} min — $${s.price.toLocaleString()})`));
  }

  console.log('\n🎉 Servicios gastro listos.\n');
}

seed();
