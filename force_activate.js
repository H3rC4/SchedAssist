const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function force() {
  const TENANT_NAME = 'Centro Gastroenterológico del Sur';
  
  console.log(`--- ACTIVANDO ${TENANT_NAME} ---`);
  
  const { data, error } = await supabase
    .from('tenants')
    .update({ 
      subscription_status: 'active',
      subscription_price_id: 'price_1TJvfKAbpjR4dXLl3AnOe4jc' 
    })
    .ilike('name', `%${TENANT_NAME}%`)
    .select();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log(`✅ ¡ÉXITO! Centro activado: ${data[0].name}`);
  } else {
    console.log('❌ No encontré el centro con ese nombre.');
  }
}

force();
