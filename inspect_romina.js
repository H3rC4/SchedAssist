const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectTenant() {
  const TENANT_ID = '8e91cd63-cbe4-4cb3-ab05-2b946e68fb6a';
  
  console.log(`Inspecting Tenant: ${TENANT_ID}`);
  
  const { data: locations } = await supabase.from('locations').select('*').eq('tenant_id', TENANT_ID);
  console.log(`Locations: ${locations?.length || 0}`);
  locations?.forEach(l => console.log(` - ${l.id}: ${l.name}`));
  
  const { data: professionals } = await supabase.from('professionals').select('*').eq('tenant_id', TENANT_ID);
  console.log(`Professionals: ${professionals?.length || 0}`);
  professionals?.forEach(p => console.log(` - ${p.id}: ${p.full_name}`));
  
  const { data: services } = await supabase.from('services').select('*').eq('tenant_id', TENANT_ID);
  console.log(`Services: ${services?.length || 0}`);
  services?.forEach(s => console.log(` - ${s.id}: ${s.name}`));
  
  const { data: clients } = await supabase.from('clients').select('*').eq('tenant_id', TENANT_ID);
  console.log(`Clients: ${clients?.length || 0}`);
  clients?.forEach(c => console.log(` - ${c.id}: ${c.first_name} ${c.last_name}`));
  
  const { data: appointments } = await supabase.from('appointments').select('*').eq('tenant_id', TENANT_ID);
  console.log(`Appointments: ${appointments?.length || 0}`);
}

inspectTenant();
