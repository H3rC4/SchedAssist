const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// USANDO ANON KEY SIN SESIÓN
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testRLS() {
  console.log('--- PRUEBA DE SEGURIDAD (Hacker Mode) ---');
  console.log('Intentando leer pacientes sin estar logueado...');
  
  const { data, error } = await supabase
    .from('clients')
    .select('*');
  
  if (error) {
    console.log('✅ BLOQUEADO: Error del servidor (esperado):', error.message);
  } else if (data && data.length > 0) {
    console.log('❌ FALLO DE SEGURIDAD: ¡He podido leer datos sin contraseña!');
    console.log(`Datos robados: ${data.length} pacientes.`);
  } else {
    console.log('✅ ÉXITO: El hacker no ve nada (array vacío).');
  }
}

testRLS();
