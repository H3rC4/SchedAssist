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

async function resetDB() {
    console.log('Iniciando borrado nuclear de la base de datos de Tenants...');

    try {
        // En PostgreSQL de Supabase, borrar registros de 'tenants' eliminará en cascada 
        // todo lo demás gracias a ON DELETE CASCADE de las FK. 
        // Eliminaremos todos los tenants existentes excepto, opcionalmente, si tuviéramos un "Master".
        // Vamos a hacer delete directo de todos.
        
        const { error: err } = await supabase.from('tenants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (err) {
            console.error('❌ Error purgando Tenants:', err);
            return;
        }

        console.log('✅ Base de datos purgata exitosamente. Todos los historiales, doctores y clientes eliminados.');
        console.log('👑 IMPORTANTE: Tu usuario Admin de Supabase Auth AÚN EXISTE, así que podrás loguearte en el panel.');

    } catch(e) {
        console.error('Fatal error:', e);
    }
}

resetDB();
