import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAccess } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenant_id');
  const clientId = searchParams.get('client_id');

  if (!tenantId || !clientId) {
    return NextResponse.json({ error: 'tenant_id and client_id required' }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const access = await verifyTenantAccess(supabase, user, tenantId);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data, error } = await supabase
    .from('clinical_records')
    .select(`
      id, content, attachments, created_at,
      professionals (id, full_name),
      appointments (id, start_at, services(name))
    `)
    .eq('tenant_id', tenantId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenant_id, client_id, professional_id, appointment_id, content, attachments } = body;

  if (!tenant_id || !client_id || !content) {
    return NextResponse.json({ error: 'tenant_id, client_id, and content required' }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const access = await verifyTenantAccess(supabase, user, tenant_id);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  // Si es profesional, forzamos que el professional_id sea el suyo
  let finalProfessionalId = professional_id;
  if (access.role === 'professional') {
    const { data: profData } = await supabase.from('professionals').select('id').eq('user_id', user!.id).single();
    if (profData) {
      finalProfessionalId = profData.id;
    }
  }

  const { data, error } = await supabase
    .from('clinical_records')
    .insert([{
      tenant_id,
      client_id,
      professional_id: finalProfessionalId,
      appointment_id,
      content,
      attachments: attachments || []
    }])
    .select(`
      id, content, attachments, created_at,
      professionals (id, full_name),
      appointments (id, start_at, services(name))
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
