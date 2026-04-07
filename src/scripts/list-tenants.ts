import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function listTenants() {
  const { data } = await supabase.from('tenants').select('id, name, slug, settings');
  console.log('\n🏥 CLINICAS EN EL SISTEMA:\n');
  data?.forEach(t => {
    console.log(`- [${t.slug}] ${t.name} (ID: ${t.id}) - Idioma: ${t.settings?.language || 'es'}`);
  });
  console.log('');
}

listTenants();
