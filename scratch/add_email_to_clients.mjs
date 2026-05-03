import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gtpnikqxhqgoohqqdzhg.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SERVICE_KEY) {
  console.error('Set SUPABASE_SERVICE_KEY env var')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// Check if email column exists
const { data, error } = await supabase.rpc('exec_sql', {
  sql: `
    ALTER TABLE clients 
    ADD COLUMN IF NOT EXISTS email TEXT;
    
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'clients' 
    ORDER BY ordinal_position;
  `
})

if (error) {
  // Try direct query instead
  console.log('RPC not available, trying direct...')
  
  // Check current schema
  const { data: cols, error: e2 } = await supabase
    .from('clients')
    .select('*')
    .limit(1)
  
  if (e2) {
    console.error('Error:', e2)
  } else {
    const sample = cols?.[0]
    console.log('Current client columns:', sample ? Object.keys(sample) : 'no rows')
    
    if (sample && !('email' in sample)) {
      console.log('⚠️  email column MISSING — run this SQL in Supabase dashboard:')
      console.log('ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;')
    } else {
      console.log('✅ email column EXISTS')
    }
  }
} else {
  console.log('Migration result:', data)
}
