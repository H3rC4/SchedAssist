import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkNaza() {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', 'naza')
    .single()

  if (error) {
    console.error('Error fetching tenant:', error)
    return
  }

  console.log('Tenant Details:', {
    id: data.id,
    name: data.name,
    timezone: data.timezone,
    settings: data.settings
  })
}

checkNaza()
