const fetch = require('node-fetch');

const projectRef = 'gtpnikqxhqgoohqqdzhg';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkTable(tableName) {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  // Note: The Supabase REST API for direct SQL queries might not be available or might require a different endpoint.
  // Alternatively, we can use the PostgREST endpoint to select from the table, but that requires the table to exist and be exposed via the API.
  // Since we are using the service role, we can try to use the SQL endpoint if it exists.
  // Let's try the SQL endpoint we tried earlier, but note that it returned 401.
  // We'll try to use the supabase-js approach in a separate script, but for now, let's just output the SQL we would run.
  console.log(`To check if ${tableName} exists, you can run:`);
  console.log(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${tableName}');`);
}

async function main() {
  await checkTable('email_verification_tokens');
  await checkTable('password_reset_tokens');
}

main();