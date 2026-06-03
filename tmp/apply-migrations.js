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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to run SQL: ${response.status} ${response.statusText}\n${errorText}`);
  }

  return response.json();
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
    console.log('Running migration 1: verification tokens');
    await runSql(sql1);
    console.log('Migration 1 successful');

    console.log('Running migration 2: password reset tokens');
    await runSql(sql2);
    console.log('Migration 2 successful');

    console.log('All migrations applied successfully');
  } catch (err) {
    console.error('Error applying migrations:', err.message);
    process.exit(1);
  }
}

main();