const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupStorage() {
  console.log('--- CONFIGURANDO STORAGE SUPABASE ---');

  // 1. Crear/Verificar bucket clinical_files
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) {
    console.error('Error listando buckets:', bErr);
    return;
  }

  const bucketName = 'clinical_files';
  const exists = buckets.find(b => b.id === bucketName);

  if (!exists) {
    console.log(`Bucket "${bucketName}" no existe. Creándolo...`);
    const { error: createErr } = await supabase.storage.createBucket(bucketName, {
      public: false, // PRIVADO por seguridad médica
      fileSizeLimit: 5242880, // 5MB
    });
    if (createErr) {
      console.error('Error creando bucket:', createErr);
    } else {
      console.log('✅ Bucket creado exitosamente (Privado).');
    }
  } else {
    console.log(`✅ Bucket "${bucketName}" ya existe.`);
    // Asegurarse de que sea privado
    if (exists.public) {
      console.log('Actualizando bucket a PRIVADO por seguridad...');
      await supabase.storage.updateBucket(bucketName, { public: false });
    }
  }

  // 2. Agregar políticas de RLS para Storage (vía SQL)
  // Como no podemos ejecutar SQL arbitrario fácilmente sin un endpoint RPC, 
  // le informaremos al usuario que esto es lo que falta si sigue fallando el upload.
  // Sin embargo, con el service role key ya deberíamos poder operar desde el backend.
  // Pero el frontend usa el anon key, así que necesita políticas.
  
  console.log('\n--- NOTA IMPORTANTE ---');
  console.log('Si el error "Bucket not found" persiste en producción, asegúrate de haber creado');
  console.log(`el bucket "${bucketName}" manualmente en el dashboard de Supabase.`);
}

setupStorage();
