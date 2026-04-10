import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findMatch() {
  const { data: tenants } = await supabase.from('tenants').select('id, name, slug');
  console.log("Tenants:", tenants);

  const { data: users } = await supabase.from('tenant_users').select('*, tenants(name)');
  console.log("Users:", users);

  // For testing
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  console.log("Auth Users:", authUsers.users.map(u => ({ email: u.email })));
}

findMatch();
