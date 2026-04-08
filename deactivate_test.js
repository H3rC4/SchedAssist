const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deactivate() {
  const TENANT_NAME = 'Centro Gastroenterológico del Sur';
  
  console.log(`--- DESACTIVANDO ${TENANT_NAME} PARA PRUEBA ---`);
  
  const { data, error } = await supabase
    .from('tenants')
    .update({ subscription_status: 'inactive' })
    .ilike('name', `%${TENANT_NAME}%`)
    .select();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('✅ Listo jefe. La cuenta de Gastro ahora es POBRE (Inactiva).');
  console.log('Ahora puedes entrar y pagar de verdad para probar el sistema.');
}

deactivate();
