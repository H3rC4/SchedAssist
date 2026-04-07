import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const whapiToken = process.env.WHAPI_API_TOKEN;
const channelId = process.env.WHAPI_CHANNEL_ID;

const targetSlug = process.argv[2];

if (!supabaseUrl || !supabaseServiceKey || !whapiToken || !channelId) {
  console.error('❌ Error: Configuración incompleta en .env (asegúrate de tener WHAPI_API_TOKEN y WHAPI_CHANNEL_ID)');
  process.exit(1);
}

if (!targetSlug) {
  console.error('❌ Error: Debes proporcionar el slug de la clínica. Ejemplo: npx tsx src/scripts/switch-whatsapp.ts itadent');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function switchWhatsApp() {
  console.log(`\n🚀 Cambiando WhatsApp a la clínica: [${targetSlug}]\n`);

  // 1. Buscar el Tenant ID
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, settings')
    .eq('slug', targetSlug)
    .single();

  if (tenantError || !tenant) {
    console.error('❌ Error: No se encontró la clínica con el slug:', targetSlug);
    return;
  }

  // 2. Vincular el número al nuevo tenant
  // Usamos upsert para que si ya existe el canal en la tabla, se actualice al nuevo tenant
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
    console.error('❌ Error moviendo WhatsApp:', upsertError);
    return;
  }

  console.log(`✅ ¡ÉXITO! Tu número de WhatsApp ahora pertenece a: ${tenant.name}`);
  console.log(`🌐 Idioma configurado: ${tenant.settings?.language || 'es'}`);
  console.log('---');
  console.log(`Canal: ${channelId}`);
  console.log('---');
  console.log('▶ Ya puedes enviar un mensaje para probar el bot de esta clínica.');
}

switchWhatsApp();
