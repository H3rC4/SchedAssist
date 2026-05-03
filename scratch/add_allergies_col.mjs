import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gtpnikqxhqgoohqqdzhg.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// Use raw SQL via pg rest
const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
  },
  body: JSON.stringify({ sql: 'ALTER TABLE clients ADD COLUMN IF NOT EXISTS allergies TEXT;' })
})

if (!res.ok) {
  // Fallback: try via supabase-js direct approach
  // We'll insert a dummy update to see if column is writable
  console.log('RPC exec_sql not available. Trying alternative...')
  
  // Use the supabase management API approach
  const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/gtpnikqxhqgoohqqdzhg/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: 'ALTER TABLE clients ADD COLUMN IF NOT EXISTS allergies TEXT;' })
  })
  const mgmtData = await mgmtRes.text()
  console.log('Management API response:', mgmtData)
} else {
  const data = await res.json()
  console.log('✅ SQL executed:', data)
}

// Verify
const { data: sample } = await supabase.from('clients').select('*').limit(1)
console.log('Columns now:', sample?.[0] ? Object.keys(sample[0]) : 'no rows')
