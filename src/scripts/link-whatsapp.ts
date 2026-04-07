import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const whapiToken = process.env.WHAPI_API_TOKEN;
const channelId = 'THOROD-YLDBK'; // Proporcionado por el usuario
const clinicSlug = 'gastro-sur';

if (!supabaseUrl || !supabaseServiceKey || !whapiToken) {
  console.error('❌ Error: Falta configuración en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function linkWhatsApp() {
  console.log(`\n🔗 Vinculando WhatsApp (Whapi) para: ${clinicSlug}\n`);

  // 1. Buscar el Tenant ID
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('slug', clinicSlug)
    .single();

  if (tenantError || !tenant) {
    console.error('❌ Error: No se encontró el tenant con el slug:', clinicSlug);
    return;
  }

  console.log(`✅ Tenant encontrado: ${tenant.name} (${tenant.id})`);

  // 2. Upsert en whatsapp_accounts
  const { error: upsertError } = await supabase
    .from('whatsapp_accounts')
    .upsert([
      {
        tenant_id: tenant.id,
        phone_number_id: channelId,
        access_token: whapiToken,
        label: 'Principal',
      }
    ], { onConflict: 'phone_number_id' });

  if (upsertError) {
    console.error('❌ Error vinculando cuenta WhatsApp:', upsertError);
    return;
  }

  console.log('✅ ¡ÉXITO! Tu cuenta de WhatsApp ha sido vinculada al tenant.');
  console.log('---');
  console.log(`Canal: ${channelId}`);
  console.log(`Tenant: ${tenant.name}`);
  console.log('---');
  console.log('▶ Ahora puedes probar el bot enviando un mensaje al número vinculado.');
}

linkWhatsApp();
