import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { addDays, format, isWeekend, setHours, setMinutes, startOfToday, endOfYear } from 'date-fns';

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

const TENANT_ID = 'de9450c1-7b43-47e2-9d60-fe4b6ffb623c';

async function main() {
  console.log('🚀 SEEDING HUGE DATA FOR CLINICA PRUEBA...');

  // 1. Professionals
  const docNames = [
    'Dr. Gregory House', 'Dr. Lisa Cuddy', 'Dr. James Wilson', 
    'Dr. Eric Foreman', 'Dr. Allison Cameron', 'Dr. Robert Chase',
    'Dr. Meredith Grey', 'Dr. Derek Shepherd', 'Dr. Cristina Yang', 'Dr. Shaun Murphy'
  ];
  const specialities = ['Diagnóstico', 'Endocrinología', 'Oncología', 'Neurología', 'Inmunología', 'Cirugía', 'Cardiología', 'Pediatría'];
  
  const prosPayload = docNames.map(name => ({
    full_name: name,
    specialty: specialities[Math.floor(Math.random() * specialities.length)],
    active: true,
    tenant_id: TENANT_ID
  }));

  const { data: pros, error: pErr } = await supabase.from('professionals').insert(prosPayload).select();
  if (pErr) throw pErr;
  console.log(`✅ ${pros?.length} Professionals created`);

  // 2. Services
  const serviceNames = [
    'Consulta General', 'Chequeo Completo', 'Radiografía', 'Análisis de Sangre', 
    'Ecocardiograma', 'Resonancia Magnética', 'Terapia Física', 'Nutrición', 
    'Vacunación', 'Control de Presión', 'Electrocardiograma', 'Dermatología'
  ];
  
  const servicesPayload = serviceNames.map(name => ({
    name,
    duration_minutes: [15, 30, 45, 60][Math.floor(Math.random() * 4)],
    price: Math.floor(Math.random() * 200) + 30,
    active: true,
    tenant_id: TENANT_ID
  }));

  const { data: services, error: sErr } = await supabase.from('services').insert(servicesPayload).select();
  if (sErr) throw sErr;
  console.log(`✅ ${services?.length} Services created`);

  // 3. Clients
  console.log('⏳ Creating 100 random clients...');
  const firstNames = ['Juan', 'Maria', 'Jose', 'Ana', 'Carlos', 'Elena', 'Diego', 'Lucia', 'Mateo', 'Sofia'];
  const lastNames = ['Garcia', 'Rodriguez', 'Lopez', 'Martinez', 'Perez', 'Sanchez', 'Gonzalez', 'Gomez'];
  
  const clientsPayload = Array.from({ length: 100 }).map(() => ({
    first_name: firstNames[Math.floor(Math.random() * firstNames.length)],
    last_name: lastNames[Math.floor(Math.random() * lastNames.length)],
    phone: `+549${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    tenant_id: TENANT_ID
  }));

  const { data: clients, error: cErr } = await supabase.from('clients').insert(clientsPayload).select();
  if (cErr) throw cErr;
  console.log(`✅ ${clients?.length} Clients created`);

  // 4. Appointments
  console.log('📅 Generating appointments for the rest of 2026...');
  const appointmentsPayload = [];
  const start = startOfToday();
  const end = endOfYear(new Date(2026, 0, 1)); // We are in 2026 based on metadata

  let current = start;
  while (current <= end) {
    if (!isWeekend(current)) {
      // 5-10 appointments per day
      const count = Math.floor(Math.random() * 6) + 5;
      for (let i = 0; i < count; i++) {
        const hour = 9 + i; // from 9:00 onwards
        const startAt = setHours(setMinutes(current, 0), hour);
        
        appointmentsPayload.push({
          tenant_id: TENANT_ID,
          client_id: clients![Math.floor(Math.random() * clients!.length)].id,
          professional_id: pros![Math.floor(Math.random() * pros!.length)].id,
          service_id: services![Math.floor(Math.random() * services!.length)].id,
          status: Math.random() > 0.2 ? 'confirmed' : 'pending',
          start_at: startAt.toISOString(),
          end_at: addDays(startAt, 0).toISOString(), // duration handled by service usually, but DB needs it
          source: 'dashboard'
        });
      }
    }
    current = addDays(current, 1);
    
    // Batch inserts to avoid payload size issues
    if (appointmentsPayload.length > 500) {
        const { error: batchErr } = await supabase.from('appointments').insert(appointmentsPayload);
        if (batchErr) console.error('Batch error:', batchErr);
        appointmentsPayload.length = 0;
    }
  }

  // Final batch
  if (appointmentsPayload.length > 0) {
    const { error: lastErr } = await supabase.from('appointments').insert(appointmentsPayload);
    if (lastErr) throw lastErr;
  }

  console.log('✅ All Appointments generated');
  console.log('✨ SEEDING COMPLETE');
}

main().catch(console.error);
