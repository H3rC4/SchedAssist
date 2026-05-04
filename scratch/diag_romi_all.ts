
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function diag() {
  const romiId = '206cdf23-5b91-4e97-a1d8-73f5cc58ad0f'
  
  console.log('--- Overrides for Romi ---')
  const { data: overrides } = await supabase
    .from('professional_availability_overrides')
    .select('*')
    .eq('professional_id', romiId)
    .order('override_date', { ascending: true })
  
  console.log(JSON.stringify(overrides, null, 2))
}

diag()
