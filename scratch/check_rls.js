const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRLS() {
  const tables = [
    'tenants', 'tenant_users', 'clients', 'appointments', 
    'services', 'professionals', 'availability_rules', 
    'whatsapp_accounts', 'clinical_records', 'locations'
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Error querying ${table}: ${error.message}`);
      } else {
        console.log(`Queried ${table} successfully`);
      }
    } catch (e) {
      console.error(e);
    }
  }
}

checkRLS();
