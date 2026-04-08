const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('--- BUSCANDO TENANTS ---');
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('id, name, subscription_status, stripe_customer_id');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('ESTADO ACTUAL:');
  tenants.forEach(t => {
    console.log(`- [${t.subscription_status}] ${t.name} (ID: ${t.id})`);
  });
}

check();
