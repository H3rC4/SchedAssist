import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function seedAdmin() {
    console.log("🛡️ Creando usuario administrador de prueba...");
    
    // Crear usuario en Auth
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: 'admin@saas.com',
        password: 'admin123',
        email_confirm: true,
        user_metadata: { role: 'admin' }
    });

    if (authErr) {
        if (authErr.message.includes('already registered')) {
            console.log("✅ El admin@saas.com ya estaba creado. ¡Todo listo!");
        } else {
            console.error("❌ Error creando usuario Auth:", authErr);
        }
        return;
    }

    console.log("✅ Administrador creado con éxito.");
    console.log("-----------------------------------------");
    console.log("Email: admin@saas.com");
    console.log("Contraseña: admin123");
    console.log("-----------------------------------------");
}

seedAdmin();
