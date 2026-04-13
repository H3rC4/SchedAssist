import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  // Check professional columns
  const { data: cols, error: errCols } = await supabase.rpc('get_columns_for_table', { table_name: 'professionals' });
  if (errCols) {
    console.log('rpc failed, trying select.');
    const { data: row } = await supabase.from('professionals').select('*').limit(1);
    console.log('Columns from a row in professionals:', row ? Object.keys(row[0] || {}) : 'no rows');
  } else {
    console.log('Professionals Columns:', cols);
  }

  // Check tenant_users role
  const { data: tuRow } = await supabase.from('tenant_users').select('*').limit(1);
  console.log('Columns from tenant_users:', tuRow ? Object.keys(tuRow[0] || {}) : 'no rows');

}

inspect().catch(console.error);
