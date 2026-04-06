import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
  const { data: prof } = await supabase.from('professionals').select('id').eq('full_name', 'Dr. Hernan').single();
  
  if (!tenant || !prof) {
      console.log('No se encontró el tenant o el profesional Dr. Hernan.');
      return;
  }

  // Lunes a Viernes 09:00 - 18:00
  const rules = [1, 2, 3, 4, 5].map(day => ({
    tenant_id: tenant.id,
    professional_id: prof.id,
    day_of_week: day,
    start_time: '09:00:00',
    end_time: '18:00:00',
    active: true
  }));

  const { error } = await supabase.from('availability_rules').insert(rules);
  if (error) console.error('Error seeding availability:', error);
  else console.log('¡Reglas de disponibilidad cargadas para Dr. Hernan!');
}

seed();
