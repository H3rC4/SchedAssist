import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GASTRO_SLUG = 'gastro-sur';

const PROFESSIONALS = [
  {
    full_name: 'Dr. Martín Ramírez',
    specialty: 'Gastroenterología Clínica',
    // Lunes (1), Miércoles (3), Viernes (5) — 08:00 a 14:00
    availability: [1, 3, 5].map(day => ({
      day_of_week: day,
      start_time: '08:00:00',
      end_time: '14:00:00',
    })),
  },
  {
    full_name: 'Dra. Valentina Ortiz',
    specialty: 'Endoscopía Digestiva',
    // Martes (2), Jueves (4) — 09:00 a 17:00
    availability: [2, 4].map(day => ({
      day_of_week: day,
      start_time: '09:00:00',
      end_time: '17:00:00',
    })),
  },
  {
    full_name: 'Dr. Santiago Flores',
    specialty: 'Hepatología',
    // Lunes (1), Martes (2), Miércoles (3) — 07:00 a 13:00
    availability: [1, 2, 3].map(day => ({
      day_of_week: day,
      start_time: '07:00:00',
      end_time: '13:00:00',
    })),
  },
  {
    full_name: 'Dra. Carolina Méndez',
    specialty: 'Coloproctología',
    // Jueves (4), Viernes (5) — 10:00 a 18:00
    availability: [4, 5].map(day => ({
      day_of_week: day,
      start_time: '10:00:00',
      end_time: '18:00:00',
    })),
  },
];

async function seed() {
  console.log('\n👨‍⚕️ Seeding profesionales del Centro Gastroenterológico...\n');

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('slug', GASTRO_SLUG)
    .single();

  if (!tenant) {
    console.error('❌ Tenant gastro-sur no encontrado. Ejecuta primero: npm run setup:gastro');
    process.exit(1);
  }

  const { data: existing } = await supabase
    .from('professionals')
    .select('full_name')
    .eq('tenant_id', tenant.id);

  const existingNames = (existing || []).map((p: any) => p.full_name);

  for (const prof of PROFESSIONALS) {
    if (existingNames.includes(prof.full_name)) {
      console.log(`ℹ️  ${prof.full_name} ya existe. Saltando...`);
      continue;
    }

    // Insertar profesional
    const { data: newProf, error: profErr } = await supabase
      .from('professionals')
      .insert([{
        tenant_id: tenant.id,
        full_name: prof.full_name,
        specialty: prof.specialty,
        active: true,
      }])
      .select()
      .single();

    if (profErr || !newProf) {
      console.error(`❌ Error creando ${prof.full_name}:`, profErr);
      continue;
    }

    console.log(`✅ ${prof.full_name} (${prof.specialty}) creado.`);

    // Insertar reglas de disponibilidad
    const rules = prof.availability.map(rule => ({
      tenant_id: tenant.id,
      professional_id: newProf.id,
      day_of_week: rule.day_of_week,
      start_time: rule.start_time,
      end_time: rule.end_time,
      active: true,
    }));

    const { error: availErr } = await supabase.from('availability_rules').insert(rules);
    if (availErr) {
      console.error(`   ⚠️ Error en disponibilidad de ${prof.full_name}:`, availErr);
    } else {
      const days = prof.availability.map(r => {
        const names = ['Dom','Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return names[r.day_of_week];
      }).join('/');
      const { start_time, end_time } = prof.availability[0];
      console.log(`   📅 Disponibilidad: ${days} ${start_time.slice(0,5)}–${end_time.slice(0,5)}`);
    }
  }

  console.log('\n🎉 Seed de profesionales gastro completado.\n');
}

seed();
