import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppointmentService } from '@/services/appointment.service';

/**
 * Public endpoint for creating appointments from the booking portal.
 * This route bypasses normal auth but uses the service-role to 
 * execute logic via AppointmentService, which includes:
 * - Timezone conversion
 * - Availability checks
 * - Overlap prevention
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { 
    tenant_id, 
    client_id, 
    professional_id, 
    service_id, 
    start_at, 
    end_at, 
    notes, 
    location_id,
    first_name,
    last_name,
    phone,
    email
  } = body;

  if (!tenant_id || !professional_id || !service_id || !start_at || !end_at) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Find or create client (if not provided)
    let finalClientId = client_id;
    if (!finalClientId) {
      const { data: existingClient } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('tenant_id', tenant_id)
        .eq('phone', phone)
        .single();

      if (existingClient) {
        finalClientId = existingClient.id;
      } else {
        const { data: newClient, error: cErr } = await supabaseAdmin
          .from('clients')
          .insert([{
            tenant_id,
            first_name,
            last_name,
            email,
            phone
          }])
          .select()
          .single();
        
        if (cErr) throw cErr;
        finalClientId = newClient.id;
      }
    }

    // 2. Create Appointment using the service (handles TZ conversion)
    const data = await AppointmentService.createAppointment(supabaseAdmin, {
      tenant_id,
      client_id: finalClientId,
      professional_id,
      service_id,
      start_at,
      end_at,
      source: 'public_portal',
      notes,
      location_id
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[public appointment create] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
