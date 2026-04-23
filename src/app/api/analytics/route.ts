import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAccess } from '@/lib/auth-utils';
import { startOfMonth, subMonths, format, parseISO } from 'date-fns';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenant_id');
  const locationId = searchParams.get('location_id');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const access = await verifyTenantAccess(supabase, user, tenantId);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  // Define date ranges: Current month and last month
  const now = new Date();
  const currentMonthStart = startOfMonth(now).toISOString();
  const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString();

  // Fetch all appointments for the current year to have enough data for charts
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

  const query = supabase
    .from('appointments')
    .select(`
      id, status, start_at,
      services (id, name, price),
      professionals (id, full_name)
    `)
    .eq('tenant_id', tenantId)
    .gte('start_at', yearStart);

  if (locationId) {
    query.eq('location_id', locationId);
  }

  const { data: apps, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!apps) {
    return NextResponse.json({ revenueByProfessional: [], popularServices: [], noShowRate: 0, appointmentsByMonth: [] });
  }

  // 1. Revenue by Professional (All time / This Year)
  const revenueByProfessionalMap: Record<string, number> = {};
  
  // 2. Popular Services (Count)
  const serviceCountMap: Record<string, { count: number; name: string; revenue: number }> = {};

  // 3. No-Show / Cancelled Rate
  let totalAppointments = 0;
  let cancelledAppointments = 0;

  // 4. Appointments by Month (for line chart)
  const appsByMonthMap: Record<string, number> = {};

  apps.forEach((app) => {
    // Basic counting
    totalAppointments++;
    if (app.status === 'cancelled') {
      cancelledAppointments++;
    }

    const monthKey = format(parseISO(app.start_at), 'MMM yyyy');
    appsByMonthMap[monthKey] = (appsByMonthMap[monthKey] || 0) + 1;

    // Only count revenue for completed/confirmed
    if (app.status === 'completed' || app.status === 'confirmed') {
      const price = (app.services as any)?.price || 0;
      const profName = (app.professionals as any)?.full_name || 'Desconocido';
      const srvName = (app.services as any)?.name || 'Desconocido';
      const srvId = (app.services as any)?.id || 'unknown';

      // Prof Revenue
      revenueByProfessionalMap[profName] = (revenueByProfessionalMap[profName] || 0) + price;

      // Services
      if (!serviceCountMap[srvId]) {
        serviceCountMap[srvId] = { count: 0, name: srvName, revenue: 0 };
      }
      serviceCountMap[srvId].count += 1;
      serviceCountMap[srvId].revenue += price;
    }
  });

  const revenueByProfessional = Object.entries(revenueByProfessionalMap)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10); // Top 10

  const popularServices = Object.values(serviceCountMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5

  const noShowRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0;

  const appointmentsByMonth = Object.entries(appsByMonthMap)
    .map(([month, count]) => ({ month, count }));

  // Sort months chronologically
  appointmentsByMonth.sort((a, b) => {
    return new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime();
  });

  return NextResponse.json({
    revenueByProfessional,
    popularServices,
    noShowRate: parseFloat(noShowRate.toFixed(1)),
    totalAppointments,
    cancelledAppointments,
    appointmentsByMonth
  });
}
