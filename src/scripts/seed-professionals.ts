import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
  if (!tenant) { console.error('No se encontró tenant.'); return; }

  // Check existing professionals
  const { data: existing } = await supabase.from('professionals').select('full_name').eq('tenant_id', tenant.id);
  const existingNames = (existing || []).map(p => p.full_name);

  const newProfs = [
    { tenant_id: tenant.id, full_name: 'Dra. Laura Martinez', specialty: 'Ortodoncia', active: true },
    { tenant_id: tenant.id, full_name: 'Dr. Carlos Vega', specialty: 'Endodoncia', active: true },
  ].filter(p => !existingNames.includes(p.full_name));

  if (newProfs.length === 0) {
    console.log('Los profesionales ya existen. Saltando inserción.');
  } else {
    const { error } = await supabase.from('professionals').insert(newProfs);
    if (error) { console.error('Error insertando profesionales:', error); return; }
    console.log(`✅ ${newProfs.length} profesionales creados.`);
  }

  // Now seed availability for the new professionals
  const { data: allProfs } = await supabase.from('professionals').select('id, full_name').eq('tenant_id', tenant.id);
  if (!allProfs) return;

  for (const prof of allProfs) {
    // Check if rules already exist
    const { data: existingRules } = await supabase.from('availability_rules')
      .select('id').eq('professional_id', prof.id).limit(1);
    
    if (existingRules && existingRules.length > 0) {
      console.log(`⏭️  ${prof.full_name} ya tiene reglas de disponibilidad.`);
      continue;
    }

    let rules: any[] = [];
    if (prof.full_name === 'Dra. Laura Martinez') {
      // Lunes, Miércoles, Viernes 10:00-16:00
      rules = [1, 3, 5].map(day => ({
        tenant_id: tenant.id, professional_id: prof.id,
        day_of_week: day, start_time: '10:00:00', end_time: '16:00:00', active: true
      }));
    } else if (prof.full_name === 'Dr. Carlos Vega') {
      // Martes, Jueves 08:00-14:00 y Sábado 09:00-13:00
      rules = [2, 4].map(day => ({
        tenant_id: tenant.id, professional_id: prof.id,
        day_of_week: day, start_time: '08:00:00', end_time: '14:00:00', active: true
      }));
      rules.push({
        tenant_id: tenant.id, professional_id: prof.id,
        day_of_week: 6, start_time: '09:00:00', end_time: '13:00:00', active: true
      });
    }

    if (rules.length > 0) {
      const { error } = await supabase.from('availability_rules').insert(rules);
      if (error) console.error(`Error para ${prof.full_name}:`, error);
      else console.log(`✅ Disponibilidad creada para ${prof.full_name}`);
    }
  }

  console.log('\n🎉 ¡Seed de profesionales completado!');
}

seed();
