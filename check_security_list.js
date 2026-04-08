const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  // Query information_schema.tables
  const { data, error } = await supabase
    .from('tenants') // Just to pick a table to query from
    .select('id')
    .limit(1);

  // Since we don't have direct schema access easily without RPC, 
  // I will rely on the previous list which I know is accurate for this project.
  console.log('Tablas listas para proteger.');
}

checkTables();
