import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: t1, error: e1 } = await supabase.from('professional_overrides').select('*').limit(1)
  const { data: t2, error: e2 } = await supabase.from('professional_availability_overrides').select('*').limit(1)

  console.log('professional_overrides exists:', !e1)
  if (e1) console.log('Error t1:', e1.message)
  console.log('professional_availability_overrides exists:', !e2)
  if (e2) console.log('Error t2:', e2.message)
}

run()
