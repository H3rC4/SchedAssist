import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { format, addDays, startOfDay, addHours, setMinutes, setHours, addMinutes } from 'date-fns';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TENANT_ID = '8e91cd63-cbe4-4cb3-ab05-2b946e68fb6a';

const PROFESSIONALS = [
  { full_name: 'Dr. Alejandro García', specialty: 'Medicina General' },
  { full_name: 'Dra. Romina Monteroni', specialty: 'Gastroenterología' },
  { full_name: 'Dr. Julián Martínez', specialty: 'Pediatría' }
];

const SERVICES = [
  { name: 'Consulta General', duration: 30, price: 50 },
  { name: 'Control Especializado', duration: 45, price: 80 },
  { name: 'Urgencia', duration: 60, price: 120 }
];

const CLIENTS = [
  { first_name: 'María', last_name: 'Pérez', phone: '+34600000001', email: 'maria@example.com' },
  { first_name: 'Juan', last_name: 'Rodríguez', phone: '+34600000002', email: 'juan@example.com' },
  { first_name: 'Ana', last_name: 'García', phone: '+34600000003', email: 'ana@example.com' },
  { first_name: 'Carlos', last_name: 'Sánchez', phone: '+34600000004', email: 'carlos@example.com' },
  { first_name: 'Elena', last_name: 'Fernández', phone: '+34600000005', email: 'elena@example.com' },
  { first_name: 'Diego', last_name: 'López', phone: '+34600000006', email: 'diego@example.com' },
  { first_name: 'Laura', last_name: 'Martínez', phone: '+34600000007', email: 'laura@example.com' },
  { first_name: 'Pablo', last_name: 'González', phone: '+34600000008', email: 'pablo@example.com' },
  { first_name: 'Sofía', last_name: 'Alonso', phone: '+34600000009', email: 'sofia@example.com' },
  { first_name: 'Javier', last_name: 'Ruiz', phone: '+34600000010', email: 'javier@example.com' }
];

async function seed() {
  console.log('🚀 Iniciando seeding para Romina Monteroni...');

  // 1. Ubicación
  const { data: loc } = await supabase.from('locations').upsert({
    tenant_id: TENANT_ID,
    name: 'Sede Central',
    address: 'Calle Falsa 123',
    city: 'Madrid',
    active: true
  }, { onConflict: 'tenant_id, name' }).select().single();
  
  const locationId = loc?.id;
  console.log('✅ Ubicación lista.');

  // 2. Profesionales
  const profIds: string[] = [];
  for (const p of PROFESSIONALS) {
    const { data: prof } = await supabase.from('professionals').upsert({
      tenant_id: TENANT_ID,
      full_name: p.full_name,
      specialty: p.specialty,
      active: true
    }, { onConflict: 'tenant_id, full_name' }).select().single();
    if (prof) profIds.push(prof.id);
  }
  console.log(`✅ ${profIds.length} Profesionales listos.`);

  // 3. Servicios
  const serviceIds: string[] = [];
  for (const s of SERVICES) {
    const { data: serv } = await supabase.from('services').upsert({
      tenant_id: TENANT_ID,
      name: s.name,
      duration_minutes: s.duration,
      price: s.price,
      active: true
    }, { onConflict: 'tenant_id, name' }).select().single();
    if (serv) serviceIds.push(serv.id);
  }
  console.log(`✅ ${serviceIds.length} Servicios listos.`);

  // 4. Clientes
  const clientIds: string[] = [];
  for (const c of CLIENTS) {
    const { data: client } = await supabase.from('clients').upsert({
      tenant_id: TENANT_ID,
      first_name: c.first_name,
      last_name: c.last_name,
      phone: c.phone,
      email: c.email,
      whatsapp_opt_in: true
    }, { onConflict: 'tenant_id, phone' }).select().single();
    if (client) clientIds.push(client.id);
  }
  console.log(`✅ ${clientIds.length} Clientes listos.`);

  // 5. Citas
  console.log('⏳ Generando citas (esto puede tardar un poco)...');
  const appointments: any[] = [];
  const today = startOfDay(new Date());

  // Llenar HOY (cada 30 mins de 09:00 a 18:00 para cada profesional)
  for (const profId of profIds) {
    for (let hour = 9; hour < 18; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const startAt = setMinutes(setHours(today, hour), min);
        const endAt = addMinutes(startAt, 30);
        
        // No todas las citas son para el mismo profesional al mismo tiempo
        // Solo añadimos si es un slot "libre" (o simplemente llenamos)
        // Usamos un cliente aleatorio
        const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
        const serviceId = serviceIds[Math.floor(Math.random() * serviceIds.length)];
        
        appointments.push({
          tenant_id: TENANT_ID,
          client_id: clientId,
          professional_id: profId,
          service_id: serviceId,
          location_id: locationId,
          status: Math.random() > 0.3 ? 'confirmed' : 'pending',
          source: 'dashboard',
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
  }

  // Citas futuras (un par por semana durante un año)
  for (let i = 1; i <= 365; i += 3) { // Cada 3 días
    const day = addDays(today, i);
    const profId = profIds[Math.floor(Math.random() * profIds.length)];
    const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
    const serviceId = serviceIds[Math.floor(Math.random() * serviceIds.length)];
    
    const startAt = setMinutes(setHours(day, 10 + Math.floor(Math.random() * 5)), Math.random() > 0.5 ? 0 : 30);
    const endAt = addMinutes(startAt, 30);

    appointments.push({
      tenant_id: TENANT_ID,
      client_id: clientId,
      professional_id: profId,
      service_id: serviceId,
      location_id: locationId,
      status: 'confirmed',
      source: 'whatsapp',
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  // Insertar en lotes de 100
  for (let i = 0; i < appointments.length; i += 100) {
    const batch = appointments.slice(i, i + 100);
    const { error } = await supabase.from('appointments').insert(batch);
    if (error) console.error('❌ Error insertando lote de citas:', error);
  }

  console.log(`✅ Se han creado ${appointments.length} citas en total.`);
  console.log('🎉 Seeding completado con éxito.');
}

seed();
