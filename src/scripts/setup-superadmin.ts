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

async function main() {
    const email = 'admin@saas.com';
    const password = 'admin123';

    try {
        const { data: user, error: userError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (userError) {
             if (userError.message.includes('already registered')) {
                 console.log('✅ Super Admin account already exists!');
             } else {
                 console.error('Error creating super admin:', userError);
             }
             return;
        }

        console.log('👑 Super Admin account created successfully!');
    } catch(err) {
        console.error('Fatal error:', err);
    }
}

main();
