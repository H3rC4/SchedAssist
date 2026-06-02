/**
 * Cleanup script for orphaned auth users
 * 
 * An orphaned user is one that:
 * 1. Exists in Supabase Auth
 * 2. Has NO corresponding tenant_users record
 * 
 * Run with: npx tsx src/scripts/cleanup-orphaned-users.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupOrphanedUsers() {
  console.log('🔍 Scanning for orphaned users...\n');

  // Get all auth users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
    perPage: 1000
  });

  if (listError) {
    console.error('Error listing users:', listError);
    process.exit(1);
  }

  console.log(`Found ${users.length} total auth users`);

  // Get all tenant_users links
  const { data: links, error: linksError } = await supabase
    .from('tenant_users')
    .select('user_id');

  if (linksError) {
    console.error('Error fetching tenant_users:', linksError);
    process.exit(1);
  }

  const linkedUserIds = new Set(links?.map(l => l.user_id) || []);
  const orphanedUsers = users.filter(u => !linkedUserIds.has(u.id));

  if (orphanedUsers.length === 0) {
    console.log('✅ No orphaned users found!');
    return;
  }

  console.log(`\n⚠️  Found ${orphanedUsers.length} orphaned user(s):`);
  for (const user of orphanedUsers) {
    console.log(`   - ${user.email} (${user.id})`);
  }

  console.log('\n🗑️  Cleaning up...');

  for (const user of orphanedUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      console.error(`   ❌ Failed to delete ${user.email}:`, error.message);
    } else {
      console.log(`   ✅ Deleted ${user.email}`);
    }
  }

  console.log('\n✨ Cleanup complete!');
}

cleanupOrphanedUsers().catch(console.error);
