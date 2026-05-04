import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRomi() {
  console.log('Checking Romi data...');
  
  // 1. Find Romi
  const { data: professionals } = await supabase
    .from('professionals')
    .select('*')
    .ilike('full_name', '%romi%');

  if (!professionals || professionals.length === 0) {
    console.log('Romi not found');
    return;
  }

  const romi = professionals[0];
  console.log('Professional:', romi.full_name, 'ID:', romi.id);

  // 2. Get Overrides
  const { data: overrides } = await supabase
    .from('professional_availability_overrides')
    .select('*')
    .eq('professional_id', romi.id)
    .order('override_date', { ascending: true });

  console.log('\n--- OVERRIDES ---');
  console.dir(overrides, { depth: null });

  // 3. Get Rules
  const { data: rules } = await supabase
    .from('availability_rules')
    .select('*')
    .eq('professional_id', romi.id)
    .order('day_of_week', { ascending: true });

  console.log('\n--- WEEKLY RULES ---');
  console.dir(rules, { depth: null });
}

checkRomi();
