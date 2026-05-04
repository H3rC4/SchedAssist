import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkOverrides() {
  const { data: profs } = await supabase
    .from('professionals')
    .select('*')
    .ilike('full_name', '%romi%');
  
  console.log('Professionals found:', profs);

  if (profs && profs.length > 0) {
    for (const prof of profs) {
      const { data: overrides } = await supabase
        .from('professional_availability_overrides')
        .select('*')
        .eq('professional_id', prof.id);
      
      const { data: rules } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('professional_id', prof.id);

      console.log(`Professional: ${prof.full_name} (${prof.id})`);
      console.log(`Tenant: ${prof.tenant_id}`);
      console.log(`Overrides:`, overrides);
      console.log(`Weekly Rules:`, rules);
      console.log('---');
    }
  }
}

checkOverrides();
