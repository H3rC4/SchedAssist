import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function setup() {
  const email = 'gastro@admin.com';
  const password = 'gastro123';
  const clinicName = 'Centro Gastroenterológico del Sur';
  const clinicSlug = 'gastro-sur';

  console.log(`\n🏥 Iniciando setup para: ${clinicName}\n`);

  // ─── 1. Crear o recuperar Tenant ────────────────────────────────────────────
  let { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', clinicSlug)
    .single();

  if (!tenant) {
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN_GASTRO || '';
    const { data: newTenant, error: createError } = await supabase
      .from('tenants')
      .insert([{
        name: clinicName,
        slug: clinicSlug,
        timezone: 'America/Argentina/Buenos_Aires',
        settings: {
          telegram_token: telegramToken,
          specialty: 'gastroenterologia',
          welcome_message: `¡Bienvenido al ${clinicName}! 🏥\nSoy tu asistente virtual para agendar consultas y estudios.`
        }
      }])
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creando tenant:', createError);
      return;
    }
    tenant = newTenant;
    console.log(`✅ Tenant creado: ${tenant.id}`);
  } else {
    console.log(`ℹ️  Tenant ya existe: ${tenant.id}`);
    // Actualizar token si existe en env
    if (process.env.TELEGRAM_BOT_TOKEN_GASTRO) {
      await supabase.from('tenants').update({
        settings: {
          ...(tenant.settings || {}),
          telegram_token: process.env.TELEGRAM_BOT_TOKEN_GASTRO,
        }
      }).eq('id', tenant.id);
      console.log('🔄 Token de Telegram Gastro actualizado en settings.');
    }
  }

  // ─── 2. Crear o recuperar usuario Auth ──────────────────────────────────────
  let userId: string;
  const { data: users } = await supabase.auth.admin.listUsers();
  const existingUser = users?.users.find(u => u.email === email);

  if (!existingUser) {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError) {
      console.error('❌ Error creando usuario Auth:', authError);
      return;
    }
    userId = authUser.user.id;
    console.log(`✅ Usuario Auth creado: ${userId}`);
  } else {
    userId = existingUser.id;
    console.log(`ℹ️  Usuario Auth ya existe: ${userId}`);
  }

  // ─── 3. Vincular usuario al tenant ──────────────────────────────────────────
  const { data: existingLink } = await supabase
    .from('tenant_users')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('user_id', userId)
    .single();

  if (!existingLink) {
    const { error: linkError } = await supabase.from('tenant_users').insert([{
      tenant_id: tenant.id,
      user_id: userId,
      role: 'tenant_admin'
    }]);
    if (linkError) {
      console.error('❌ Error vinculando usuario al tenant:', linkError);
      return;
    }
    console.log('✅ Usuario vinculado al tenant como admin.');
  } else {
    console.log('ℹ️  Usuario ya estaba vinculado al tenant.');
  }

  // ─── 4. Crear perfil profesional del admin ──────────────────────────────────
  const { data: existingProf } = await supabase
    .from('professionals')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('user_id', userId)
    .single();

  if (!existingProf) {
    const { error: profError } = await supabase.from('professionals').insert([{
      tenant_id: tenant.id,
      user_id: userId,
      full_name: 'Dr. Admin Gastro',
      specialty: 'Gastroenterología',
      active: true
    }]);
    if (profError) {
      console.error('❌ Error creando perfil profesional:', profError);
      return;
    }
    console.log('✅ Perfil profesional creado.');
  } else {
    console.log('ℹ️  Perfil profesional ya existe.');
  }

  console.log('\n══════════════════════════════════════════════');
  console.log('✅  SETUP GASTRO COMPLETADO');
  console.log('══════════════════════════════════════════════');
  console.log(`   Clínica : ${clinicName}`);
  console.log(`   Email   : ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Tenant ID: ${tenant.id}`);
  console.log('══════════════════════════════════════════════\n');
  console.log('▶ Siguiente paso: npm run seed:gastro:professionals');
}

setup();
