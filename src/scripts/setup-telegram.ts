import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupTelegram() {
  console.log('--- Configurando Telegram Bot para la Clínica Principal ---');

  // 1. Encontrar al usuario prueba@test.com
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  const pruebaUser = users?.users.find(u => u.email === 'prueba@test.com');

  if (!pruebaUser) {
      console.error('No se encontró el usuario prueba@test.com');
      return;
  }

  // 1.2 Encontrar a qué tenant pertenece
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', pruebaUser.id)
    .single();

  if (!tenantUser) {
      console.error('El usuario prueba@test.com no tiene una clínica (tenant) asociada.');
      return;
  }

  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .select('id, name, settings')
    .eq('id', tenantUser.tenant_id)
    .single();

  if (tenantErr || !tenant) {
      console.error('No se encontró la clínica asociada a prueba@test.com.');
      return;
  }
  console.log(`Clínica test/prueba seleccionada: ${tenant.name} (${tenant.id})`);

  // 2. Actualizar settings con el Telegram Token
  const updatedSettings = {
      ...(tenant.settings || {}),
      telegram_token: process.env.TELEGRAM_BOT_TOKEN
  };

  const { error: updateErr } = await supabase
      .from('tenants')
      .update({ settings: updatedSettings })
      .eq('id', tenant.id);

  if (updateErr) {
      console.error('Error al actualizar la clínica:', updateErr);
      return;
  }

  console.log('¡Éxito! Token de Telegram vinculado a la clínica.');

  // 3. Registrar Webhook en Telegram
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/telegram`;
  console.log(`Registrando Webhook: ${webhookUrl}`);

  const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook?url=${webhookUrl}`;
  
  try {
      const response = await fetch(telegramUrl);
      const data = await response.json();
      if (data.ok) {
          console.log('¡Webhook de Telegram registrado con éxito!');
      } else {
          console.error('Error al registrar webhook:', data.description);
      }
  } catch (err) {
      console.error('Error de red al registrar webhook:', err);
  }
}

setupTelegram();
