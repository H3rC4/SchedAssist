import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppointmentService } from '@/services/appointment.service';
import { EmailService } from '@/services/email.service';
import { generateCancellationToken } from '@/lib/utils';

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
    
    // 3. Generate and update cancellation token
    const cancellationToken = generateCancellationToken();
    await supabaseAdmin
      .from('appointments')
      .update({ cancellation_token: cancellationToken })
      .eq('id', data.id);
    
    // 4. Send confirmation email (non-blocking - don't fail booking if email fails)
    try {
      const [{ data: tenantCfg }, { data: clientData }, { data: profData }] = await Promise.all([
        supabaseAdmin.from('tenants').select('settings').eq('id', tenant_id).single(),
        supabaseAdmin.from('clients').select('first_name, last_name, email').eq('id', finalClientId).single(),
        supabaseAdmin.from('professionals').select('full_name').eq('id', professional_id).single(),
      ]);
      
      if (clientData?.email) {
        const tenantName = tenantCfg?.settings?.clinic_name || tenantCfg?.name || 'Clinic';
        const professionalName = profData?.full_name || 'Professional';
        const startDate = new Date(start_at);
        const dateStr = `${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()}`;
        const timeStr = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
        const cancellationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/appointments/cancel/${cancellationToken}`;
        
        // Send email in background (don't await for response to avoid delaying the booking)
        EmailService.sendAppointmentConfirmation(
          clientData.email,
          data.id,
          `${clientData.first_name} ${clientData.last_name}`,
          professionalName,
          dateStr,
          timeStr,
          cancellationLink,
          tenantName,
          tenantCfg?.settings || {}
        ).catch(emailErr => {
          console.warn('[EmailService] Failed to send confirmation email (non-critical):', emailErr);
        });
      }
    } catch (emailSetupErr) {
      console.warn('[EmailService] Failed to setup email sending (non-critical):', emailSetupErr);
    }
    
    // Return the appointment data with the token included
    return NextResponse.json({ ...data, cancellation_token: cancellationToken });
  } catch (error: any) {
    console.error('[public appointment create] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
