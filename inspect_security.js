const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSchema() {
  console.log('--- INSPECCIONANDO SEGURIDAD ---');
  
  // List all tables from public schema (metadatos)
  const { data: tables, error } = await supabase.rpc('get_tables_info'); 
  // Wait, I might not have this RPC. I'll use a direct query if possible or list known tables.
  
  const knownTables = [
    'tenants', 
    'tenant_users', 
    'clients', 
    'appointments', 
    'services', 
    'professionals', 
    'availability_rules',
    'whatsapp_accounts'
  ];

  for (const table of knownTables) {
    // There isn't a simple way to check RLS via supabase-js without RPC.
    // But we can try to fetch a row without auth to see if it's protected.
    // Or just assume the email is right and we need to ENABLE IT ALL.
    console.log(`Verificando tabla: ${table}`);
  }
}

inspectSchema();
