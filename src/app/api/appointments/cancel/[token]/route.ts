import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppointmentService } from '@/services/appointment.service';
import { NotificationService } from '@/services/notification.service';
import { translations, Language } from '@/lib/i18n';

/**
 * GET /api/appointments/cancel/[token]
 * Public endpoint to cancel an appointment via cancellation token (from email)
 * No authentication required - uses token validation only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  
  if (!token) {
    return NextResponse.json(
      { error: 'Cancellation token is required' }, 
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Find appointment by cancellation token
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        tenant_id,
        start_at,
        end_at,
        notes,
        client_id,
        professional_id,
        service_id,
        location_id,
        cancellation_token,
        status
      `)
      .eq('cancellation_token', token)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Invalid or expired cancellation link' }, 
        { status: 404 }
      );
    }

    // 2. Check if already cancelled
    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'This appointment has already been cancelled' }, 
        { status: 400 }
      );
    }

    // 3. Cancel the appointment using the service (includes 24-hour rule check)
    // We'll use a generic reason since it's patient-initiated
    const cancellationReason = 'patient_cancelled_via_email';
    
    const cancelledAppointment = await AppointmentService.cancelAppointment(supabase, {
      appointment_id: appointment.id,
      tenant_id: appointment.tenant_id,
      reason: cancellationReason,
      // No user_id since it's patient-initiated via public link
      is_admin_override: false
    });

    // 4. Fetch related data for notification
    const [{ data: tenantCfg }, { data: clientData }, { data: profData }] = await Promise.all([
      supabase.from('tenants').select('settings').eq('id', appointment.tenant_id).single(),
      supabase.from('clients').select('first_name, last_name, email').eq('id', appointment.client_id).single(),
      supabase.from('professionals').select('full_name').eq('id', appointment.professional_id).single(),
    ]);

    const lang: Language = tenantCfg?.settings?.language || 'es';
    const t = translations[lang] || translations['es'];
    const patientName = clientData ? `${clientData.first_name} ${clientData.last_name}` : '—';
    const profName = profData?.full_name || '—';
    const startDate = new Date(appointment.start_at);
    const dateStr = format(startDate, lang === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy');
    const timeStr = format(startDate, 'HH:mm');

    // 5. Send cancellation notification
    await NotificationService.createNotification(supabase, {
      tenant_id: appointment.tenant_id,
      type: 'appointment_cancelled',
      title: t.notification_appointment_cancelled,
      body: t.notify_body_cancelled(patientName, profName, dateStr),
      metadata: { 
        appointment_id: appointment.id, 
        client_id: appointment.client_id, 
        professional_id: appointment.professional_id 
      }
    });

    // 6. Redirect to a cancellation confirmation page or return JSON
    // For now, return success JSON - frontend can handle redirect
    return NextResponse.json({
      success: true,
      message: t.appointment_cancelled_success || 'Appointment cancelled successfully',
      appointment: {
        id: cancelledAppointment.id,
        date: dateStr,
        time: timeStr,
        professional: profName
      }
    });

  } catch (error: any) {
    console.error('[cancel appointment via token] Error:', error);
    
    // Handle specific error types from AppointmentService.cancelAppointment
    if (error.message && error.message.includes('24 horas')) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 } // Bad request - violates 24-hour rule
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to cancel appointment' }, 
      { status: 500 }
    );
  }
}

// Helper date format function (avoid importing date-fns/locale in API route)
function format(date: Date, formatStr: string): string {
  // Simple format for YYYY-MM-DD or HH:mm - in production would use date-fns
  if (formatStr === 'MM/dd/yyyy') {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }
  if (formatStr === 'dd/MM/yyyy') {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }
  if (formatStr === 'HH:mm') {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  return date.toISOString(); // fallback
}