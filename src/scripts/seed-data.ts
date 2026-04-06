import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
  if (!tenant) return;

  const services = [
    { tenant_id: tenant.id, name: 'Limpieza Dental', duration_minutes: 30, price: 5000, active: true },
    { tenant_id: tenant.id, name: 'Consulta General', duration_minutes: 20, price: 3000, active: true },
    { tenant_id: tenant.id, name: 'Extracción Simple', duration_minutes: 45, price: 8000, active: true },
    { tenant_id: tenant.id, name: 'Blanqueamiento', duration_minutes: 60, price: 15000, active: true },
  ];

  const { error } = await supabase.from('services').insert(services);
  if (error) console.error('Error seeding services:', error);
  else console.log('¡Servicios cargados con éxito!');
}

seed();
