import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function reset() {
    await supabase.from('appointments').update({ status: 'confirmed' }).eq('status', 'awaiting_confirmation');
    console.log('Restaurados a confirmed');
}
reset();
