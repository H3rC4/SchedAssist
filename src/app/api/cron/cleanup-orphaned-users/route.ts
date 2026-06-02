import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Cron job to cleanup orphaned auth users
 * 
 * Schedule this in Vercel Cron Jobs (vercel.json):
 * { "crons": [{ "path": "/api/cron/cleanup-orphaned-users", "schedule": "0 3 * * *" }] }
 * 
 * Protect with CRON_SECRET for security.
 */

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get all auth users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
      perPage: 1000
    });

    if (listError) throw listError;

    // Get all tenant_users links
    const { data: links, error: linksError } = await supabase
      .from('tenant_users')
      .select('user_id');

    if (linksError) throw linksError;

    const linkedUserIds = new Set(links?.map(l => l.user_id) || []);
    const orphanedUsers = users.filter(u => !linkedUserIds.has(u.id));

    if (orphanedUsers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No orphaned users found',
        deleted: 0
      });
    }

    // Delete orphaned users
    let deleted = 0;
    for (const user of orphanedUsers) {
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (!error) deleted++;
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deleted} orphaned user(s)`,
      deleted,
      emails: orphanedUsers.map(u => u.email)
    });

  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
