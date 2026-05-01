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

async function seed() {
  console.log('🚀 Iniciando seeding robusto para Romina Monteroni...');

  // 1. Obtener o crear Ubicación
  let { data: locations } = await supabase.from('locations').select('id').eq('tenant_id', TENANT_ID);
  let locationId;
  if (!locations || locations.length === 0) {
    const { data: loc } = await supabase.from('locations').insert({
      tenant_id: TENANT_ID,
      name: 'Clínica Monteroni Central',
      address: 'Av. Libertador 1234',
      city: 'Buenos Aires',
      active: true
    }).select().single();
    locationId = loc?.id;
  } else {
    locationId = locations[0].id;
  }
  console.log('✅ Ubicación lista:', locationId);

  // 2. Obtener o crear Profesionales
  const professionalsToCreate = [
    { full_name: 'Dr. Alejandro García', specialty: 'Medicina General' },
    { full_name: 'Dra. Romina Monteroni', specialty: 'Gastroenterología' },
    { full_name: 'Dr. Julián Martínez', specialty: 'Pediatría' }
  ];

  for (const p of professionalsToCreate) {
    await supabase.from('professionals').insert({
      tenant_id: TENANT_ID,
      full_name: p.full_name,
      specialty: p.specialty,
      active: true
    });
  }

  const { data: profs } = await supabase.from('professionals').select('id, full_name').eq('tenant_id', TENANT_ID);
  const profIds = profs?.map(p => p.id) || [];
  console.log('✅ Profesionales listos:', profs?.map(p => p.full_name).join(', '));

  // 3. Obtener o crear Servicios
  const servicesToCreate = [
    { name: 'Consulta Médica', duration_minutes: 30, price: 50 },
    { name: 'Control Gastroenterología', duration_minutes: 45, price: 90 },
    { name: 'Chequeo Pediátrico', duration_minutes: 30, price: 60 }
  ];

  for (const s of servicesToCreate) {
    await supabase.from('services').insert({
      tenant_id: TENANT_ID,
      name: s.name,
      duration_minutes: s.duration_minutes,
      price: s.price,
      active: true
    });
  }

  const { data: servs } = await supabase.from('services').select('id, name').eq('tenant_id', TENANT_ID);
  const serviceIds = servs?.map(s => s.id) || [];
  console.log('✅ Servicios listos:', servs?.map(s => s.name).join(', '));

  // 4. Obtener o crear Clientes
  const clientsToCreate = [
    { first_name: 'María', last_name: 'Gómez', phone: '1122334455' },
    { first_name: 'Juan', last_name: 'Pérez', phone: '1133445566' },
    { first_name: 'Ana', last_name: 'López', phone: '1144556677' },
    { first_name: 'Carlos', last_name: 'Rodríguez', phone: '1155667788' }
  ];

  for (const c of clientsToCreate) {
    await supabase.from('clients').insert({
      tenant_id: TENANT_ID,
      first_name: c.first_name,
      last_name: c.last_name,
      phone: c.phone,
      whatsapp_opt_in: true
    });
  }

  const { data: cls } = await supabase.from('clients').select('id').eq('tenant_id', TENANT_ID);
  const clientIds = cls?.map(c => c.id) || [];
  console.log('✅ Clientes listos:', clientIds.length);

  // 5. Generar Citas
  console.log('⏳ Generando citas...');
  const appointments: any[] = [];
  const today = startOfDay(new Date());

  // Llenar HOY para todos los doctores
  for (const profId of profIds) {
    for (let hour = 8; hour < 20; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const startAt = setMinutes(setHours(today, hour), min);
        const endAt = addMinutes(startAt, 30);
        
        appointments.push({
          tenant_id: TENANT_ID,
          client_id: clientIds[Math.floor(Math.random() * clientIds.length)],
          professional_id: profId,
          service_id: serviceIds[Math.floor(Math.random() * serviceIds.length)],
          location_id: locationId,
          status: 'confirmed',
          source: 'dashboard',
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString()
        });
      }
    }
  }

  // Llenar el año (algunas citas salteadas)
  for (let i = 1; i <= 365; i++) {
    const day = addDays(today, i);
    // 3 citas por día al azar
    for (let j = 0; j < 3; j++) {
      const hour = 9 + Math.floor(Math.random() * 8);
      const startAt = setMinutes(setHours(day, hour), Math.random() > 0.5 ? 0 : 30);
      const endAt = addMinutes(startAt, 30);
      
      appointments.push({
        tenant_id: TENANT_ID,
        client_id: clientIds[Math.floor(Math.random() * clientIds.length)],
        professional_id: profIds[Math.floor(Math.random() * profIds.length)],
        service_id: serviceIds[Math.floor(Math.random() * serviceIds.length)],
        location_id: locationId,
        status: 'confirmed',
        source: 'whatsapp',
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString()
      });
    }
  }

  console.log(`📦 Insertando ${appointments.length} citas...`);
  
  // Insertar por lotes
  for (let i = 0; i < appointments.length; i += 100) {
    const batch = appointments.slice(i, i + 100);
    const { error } = await supabase.from('appointments').insert(batch);
    if (error) {
      console.error('❌ Error en lote:', error.message);
    }
  }

  console.log('🎉 Seeding finalizado con éxito.');
}

seed();
