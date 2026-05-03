import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumn() {
  // Use rpc to run sql if available, or just try to add it via a query if possible
  // In Supabase, you can't run DDL via the standard client unless you have a specific RPC
  // However, I can try to see if I can use the 'notes' field for now, or if I should create a new record type in clinical_records.
  
  // Actually, the user wants it in the "Ficha" which usually represents the patient's static info.
  // I'll try to run a query to add the column.
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'ALTER TABLE clients ADD COLUMN IF NOT EXISTS allergies TEXT;' });
  
  if (error) {
    console.error('Error adding column (RPC exec_sql might not exist):', error);
    console.log('I will use the notes field or handle it in clinical_records if I cannot add the column.');
  } else {
    console.log('Column allergies added successfully or already exists.');
  }
}

addColumn();
