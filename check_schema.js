const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('--- REVISANDO TABLA APPOINTMENTS ---');
  
  const { data, error } = await supabase
    .from('appointments')
    .select('id, location_id')
    .limit(1);
  
  if (error) {
    console.error('ERROR: Faltan columnas en appointments:', error.message);
  } else {
    console.log('✅ Columna location_id en appointments encontrada.');
  }
}

checkSchema();
