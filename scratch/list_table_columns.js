const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listColumns(table) {
  console.log(`Checking columns for table: ${table}`);
  const { data: row, error: queryError } = await supabase.from(table).select('*').limit(1);
  if (queryError) {
    console.error('Error fetching row:', queryError);
  } else if (row && row.length > 0) {
    console.log('Columns:', Object.keys(row[0]));
  } else {
    console.log(`No rows in ${table} to check columns.`);
  }
}

const table = process.argv[2] || 'appointments';
listColumns(table);
