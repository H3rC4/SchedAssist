const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  const TENANT_ID = 'd92b8686-b223-43b0-a93d-94081d78f3dc';
  
  const { data: users, error } = await supabase
    .from('tenant_users')
    .select('user_id, role')
    .eq('tenant_id', TENANT_ID);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Usuarios en el tenant ${TENANT_ID}:`, JSON.stringify(users, null, 2));
}

checkUsers();
