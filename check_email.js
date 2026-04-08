const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAuth() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  const target = users.find(u => u.id === '0003cfff-673e-4bab-9a5e-7464daf3e909');
  if (target) {
    console.log('Usuario encontrado:', target.email);
  } else {
    console.log('No encontré el usuario en Auth.');
  }
}

checkAuth();
