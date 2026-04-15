import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('Adding cancellation_notified column...')
  const { error } = await supabase.rpc('run_sql', {
    sql: 'ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_notified BOOLEAN DEFAULT FALSE;'
  })

  if (error) {
    if (error.message.includes('run_sql')) {
        console.error('RPC run_sql not found. You might need to add the column manually in the Supabase Dashboard.')
        console.log('SQL: ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_notified BOOLEAN DEFAULT FALSE;')
    } else {
        console.error('Error adding column:', error)
    }
  } else {
    console.log('Column added successfully (or already existed).')
  }
}

run()
