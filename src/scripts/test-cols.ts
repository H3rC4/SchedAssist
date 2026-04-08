import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkCols() {
  const { data, error } = await supabase.rpc('get_columns', { table_name: 'availability_rules' });
  console.log(data || error);
  // Alternative method: try an invalid select and catch error
  const res = await supabase.from('availability_rules').select('lunch_break_start').limit(1);
  console.log("Select test:", res.error?.message);
}

checkCols();
