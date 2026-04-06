import { createClient } from '@supabase/supabase-js';
import { addDays, setHours, setMinutes, startOfHour } from 'date-fns';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedAppointments() {
  console.log('--- SEEDING MOCK APPOINTMENTS ---');
  
  const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
  const { data: prof } = await supabase.from('professionals').select('id').limit(1).single();
  const { data: service } = await supabase.from('services').select('id').limit(1).single();
  
  if (!tenant || !prof || !service) {
    console.error('Missing setup! Run setup scripts first.');
    return;
  }

  // Create or Find a mock client
  let { data: client } = await supabase.from('clients')
    .select('id')
    .eq('phone', 'tg_123456789') // Mock TG phone
    .single();

  if (!client) {
    const { data: newClient } = await supabase.from('clients').insert([{
        tenant_id: tenant.id,
        first_name: 'Paciente',
        last_name: 'Prueba',
        phone: 'tg_123456789', // Put YOUR telegram ID here if you want to test the reminders
        notes: JSON.stringify({ step: 'STARTING' })
    }]).select().single();
    client = newClient;
  }

  const tomorrow = addDays(new Date(), 1);
  const startAt = startOfHour(setHours(tomorrow, 10)).toISOString();
  const endAt = startOfHour(setHours(tomorrow, 11)).toISOString();

  const mockAppointments = [
    {
      tenant_id: tenant.id,
      client_id: client!.id,
      professional_id: prof.id,
      service_id: service.id,
      start_at: startAt,
      end_at: endAt,
      status: 'confirmed',
      source: 'dashboard'
    }
  ];

  const { error } = await supabase.from('appointments').insert(mockAppointments);
  
  if (error) console.error('Error seeding appointments:', error);
  else console.log('✅ Cita de prueba creada para mañana a las 10:00hs!');
}

seedAppointments();
