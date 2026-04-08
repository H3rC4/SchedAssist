const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('--- REVISANDO COLUMNAS DE TENANTS ---');
  
  // Probamos pedir una fila y ver qué columnas trae
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Columnas encontradas:', Object.keys(data[0]));
  } else {
    console.log('No hay datos en tenants, pero la tabla existe.');
  }
}

checkSchema();
