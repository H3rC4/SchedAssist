import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppointmentService } from '@/services/appointment.service';

// Public endpoint – requires tenant_id + professional_id + date in query params.
// No authentication needed because the public booking portal uses it.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenant_id = searchParams.get('tenant_id');
  const professional_id = searchParams.get('professional_id');
  const date = searchParams.get('date');
  const service_id = searchParams.get('service_id') || undefined;

  if (!tenant_id || !professional_id || !date) {
    return NextResponse.json(
      { error: 'Missing required parameters: tenant_id, professional_id, date' },
      { status: 400 }
    );
  }

  // Use service-role for this query so it bypasses RLS for public portal reads
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const result = await AppointmentService.getAvailabilityDetails(supabase, {
      tenant_id,
      professional_id,
      date,
      service_id,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[available-slots] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
