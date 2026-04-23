
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  const { data: users, error } = await supabase
    .from('tenant_users')
    .select('user_id, role, tenant_id, tenants(name)');
  
  if (error) {
    console.error(error);
    return;
  }

  console.log('--- Tenant Users ---');
  users.forEach(u => {
    console.log(`User: ${u.user_id} | Role: ${u.role} | Tenant: ${u.tenants?.name} (${u.tenant_id})`);
  });
}

checkUsers();
