const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdmin() {
  const EMAIL = 'admin@gastro.com';
  const PASSWORD = 'AdminGastro2026!';
  const TENANT_ID = 'd92b8686-b223-43b0-a93d-94081d78f3dc';

  console.log(`--- CREANDO USUARIO ${EMAIL} ---`);

  // 1. Crear usuario en Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('ℹ️ El usuario ya existía en Auth. Intentando vincularlo...');
      // Buscar el ID del usuario existente
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existing = users.find(u => u.email === EMAIL);
      if (existing) {
        await linkToTenant(existing.id, TENANT_ID);
      }
    } else {
      console.error('Error Auth:', authError);
    }
    return;
  }

  if (authData.user) {
    console.log('✅ Usuario creado en Auth.');
    await linkToTenant(authData.user.id, TENANT_ID);
  }
}

async function linkToTenant(userId, tenantId) {
  // 2. Vincular al tenant
  const { error: linkError } = await supabase
    .from('tenant_users')
    .insert([{
      user_id: userId,
      tenant_id: tenantId,
      role: 'tenant_admin'
    }]);

  if (linkError) {
    if (linkError.code === '23505') {
       console.log('ℹ️ El usuario ya estaba vinculado a este tenant.');
    } else {
       console.error('Error vinculación:', linkError);
    }
  } else {
    console.log('✅ Usuario vinculado al tenant como Admin.');
  }
}

createAdmin();
