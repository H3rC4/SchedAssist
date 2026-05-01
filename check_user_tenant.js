const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
  const EMAIL = 'rominamonteroni@gmail.com';
  
  console.log(`Searching for user: ${EMAIL}`);
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error listing users:', error);
    return;
  }
  
  const user = users.find(u => u.email === EMAIL);
  
  if (!user) {
    console.log('User not found in Auth.');
    return;
  }
  
  console.log(`User ID: ${user.id}`);
  
  const { data: tenantUsers, error: tenantError } = await supabase
    .from('tenant_users')
    .select('tenant_id, role')
    .eq('user_id', user.id);
    
  if (tenantError) {
    console.error('Error fetching tenant users:', tenantError);
    return;
  }
  
  if (tenantUsers.length === 0) {
    console.log('User not linked to any tenant.');
    return;
  }
  
  console.log('Tenant Connections:');
  tenantUsers.forEach(tu => {
    console.log(`- Tenant ID: ${tu.tenant_id}, Role: ${tu.role}`);
  });
}

checkUser();
