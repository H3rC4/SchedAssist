import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function cleanupDuplicates() {
    console.log('⏳ Buscando servicios duplicados...');
    const { data: services } = await supabase.from('services').select('*').order('created_at', { ascending: true });
    
    if (!services) return;
    
    const nameMap: Record<string, any> = {};
    let deleted = 0;

    for (const s of services) {
        // Create a unique key per tenant and service name
        const key = `${s.tenant_id}_${s.name.trim().toLowerCase()}`;
        
        if (!nameMap[key]) {
            nameMap[key] = s;
        } else {
            console.log(`⚠️ Encontrado duplicado para: ${s.name}`);
            const primaryId = nameMap[key].id;
            
            // Mover citas del servicio duplicado al principal
            const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('service_id', s.id);
            if (count && count > 0) {
                console.log(`   🔄 Moviendo ${count} citas al servicio original...`);
                await supabase.from('appointments').update({ service_id: primaryId }).eq('service_id', s.id);
            }
            
            // Borrar duplicado
            console.log(`   🗑️ Borrando servicio duplicado (ID: ${s.id})`);
            await supabase.from('services').delete().eq('id', s.id);
            deleted++;
        }
    }
    console.log(`✨ Limpieza terminada. Se eliminaron ${deleted} servicios duplicados.`);
}

cleanupDuplicates();
