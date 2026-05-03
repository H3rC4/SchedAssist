import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gtpnikqxhqgoohqqdzhg.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// Check if allergies column exists
const { data: cols } = await supabase.from('clients').select('*').limit(1)
const sample = cols?.[0]

if (sample) {
  const keys = Object.keys(sample)
  console.log('Columns:', keys)
  console.log('allergies exists?', 'allergies' in sample)
  console.log('email exists?', 'email' in sample)
}
