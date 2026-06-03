const fetch = require('node-fetch');

const projectRef = 'gtpnikqxhqgoohqqdzhg';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!serviceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
  process.exit(1);
}

async function runSql(sql) {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/sql`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  const responseText = await response.text();
  
  if (!response.ok) {
    throw new Error(`Failed to run SQL: ${response.status} ${response.statusText}\n${responseText}`);
  }

  return JSON.parse(responseText);
}

// Read the SQL files
const fs = require('fs');
const path = require('path');

const migration1Path = path.join(__dirname, '..', 'supabase', 'migrations', '20260602001_create_verification_tokens.sql');
const migration2Path = path.join(__dirname, '..', 'supabase', 'migrations', '20260602002_create_password_reset_tokens.sql');

let sql1, sql2;

try {
  sql1 = fs.readFileSync(migration1Path, 'utf8');
  sql2 = fs.readFileSync(migration2Path, 'utf8');
} catch (err) {
  console.error('Error reading SQL files:', err);
  process.exit(1);
}

async function main() {
  try {
    console.log('Checking if verification tokens table exists...');
    // First, let's check if we can query the table
    try {
      await runSql('SELECT 1 FROM email_verification_tokens LIMIT 1;');
      console.log('Verification tokens table already exists');
    } catch (error) {
      if (error.message.includes('could not find relation')) {
        console.log('Verification tokens table does not exist, creating...');
        await runSql(sql1);
        console.log('Verification tokens table created successfully');
      } else {
        throw error;
      }
    }
    
    console.log('Checking if password reset tokens table exists...');
    try {
      await runSql('SELECT 1 FROM password_reset_tokens LIMIT 1;');
      console.log('Password reset tokens table already exists');
    } catch (error) {
      if (error.message.includes('could not find relation')) {
        console.log('Password reset tokens table does not exist, creating...');
        await runSql(sql2);
        console.log('Password reset tokens table created successfully');
      } else {
        throw error;
      }
    }
    
    console.log('All migrations are up to date');
  } catch (err) {
    console.error('Error applying migrations:', err.message);
    // If it's a JWT error, let's try a different approach
    if (err.message.includes('JWT failed verification') || err.message.includes('401')) {
      console.log('Attempting alternative approach using supabase-js...');
      await applyMigrationsWithJsClient();
    } else {
      process.exit(1);
    }
  }
}

async function applyMigrationsWithJsClient() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Try to run the SQL using rpc or direct query
    console.log('Trying to apply migrations via supabase-js...');
    
    // Since we can't directly execute arbitrary SQL with the JS client easily,
    // let's try to check if tables exist by attempting to select from them
    const { data: verificationData, error: verificationError } = await supabase
      .from('email_verification_tokens')
      .select('count')
      .limit(1);
      
    if (verificationError) {
      console.log('Verification tokens table does not exist via JS client either');
      console.log('Error:', verificationError.message);
    } else {
      console.log('Verification tokens table exists via JS client');
    }
    
    const { data: resetData, error: resetError } = await supabase
      .from('password_reset_tokens')
      .select('count')
      .limit(1);
      
    if (resetError) {
      console.log('Password reset tokens table does not exist via JS client either');
      console.log('Error:', resetError.message);
    } else {
      console.log('Password reset tokens table exists via JS client');
    }
  } catch (jsError) {
    console.error('Error with JS client approach:', jsError.message);
  }
}

main();