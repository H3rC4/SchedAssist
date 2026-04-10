import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

async function explore() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('--- CLIENTS ---')
  const { data: client, error: cErr } = await supabase.from('clients').select('*').limit(1).single()
  if (cErr) console.error(cErr)
  else console.log(Object.keys(client))

  console.log('\n--- APPOINTMENTS ---')
  const { data: app, error: aErr } = await supabase.from('appointments').select('*').limit(1).single()
  if (aErr) console.error(aErr)
  else console.log(Object.keys(app))
}

explore()
