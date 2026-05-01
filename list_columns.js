const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listColumns() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'appointments' });
  
  if (error) {
    // If RPC doesn't exist, try a generic query and check a row
    console.log('RPC failed, trying generic query...');
    const { data: row, error: queryError } = await supabase.from('appointments').select('*').limit(1);
    if (queryError) {
      console.error('Error fetching row:', queryError);
    } else if (row && row.length > 0) {
      console.log('Columns:', Object.keys(row[0]));
    } else {
       // If no rows, check a different way?
       console.log('No rows in appointments to check columns.');
    }
    return;
  }
  
  console.log('Columns:', data);
}

listColumns();
