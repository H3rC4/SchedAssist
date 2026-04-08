import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function testInsert() {
  const {data: profs} = await supabase.from('professionals').select('id, tenant_id').limit(1);
  if (!profs || profs.length === 0) { console.log("No profs"); return; }
  
  const prof = profs[0];
  console.log("Testing prof:", prof);

  const rule = {
    tenant_id: prof.tenant_id,
    professional_id: prof.id,
    day_of_week: 1,
    start_time: '09:00:00',
    end_time: '18:00:00',
    active: true,
    lunch_break_start: null,
    lunch_break_end: null
  };

  const { data, error } = await supabase
    .from('availability_rules')
    .insert([rule])
    .select();

  console.log("Insert response:", data, error);
}

testInsert();
