const fetch = require('node-fetch');

const projectRef = 'gtpnikqxhqgoohqqdzhg';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!serviceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
  process.exit(1);
}

async function testToken() {
  // Test 1: Try to get project information
  const projectUrl = `https://api.supabase.com/v1/projects/${projectRef}`;
  console.log(`Testing project endpoint: ${projectUrl}`);
  const projectResponse = await fetch(projectUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
  });
  console.log(`Project response status: ${projectResponse.status}`);
  if (!projectResponse.ok) {
    const errorText = await projectResponse.text();
    console.error(`Project response error: ${errorText}`);
  } else {
    const projectData = await projectResponse.json();
    console.log(`Project response: ${JSON.stringify(projectData, null, 2)}`);
  }

  // Test 2: Try to run a simple SQL query (like selecting version)
  const sqlUrl = `https://api.supabase.com/v1/projects/${projectRef}/sql`;
  console.log(`Testing SQL endpoint: ${sqlUrl}`);
  const sqlResponse = await fetch(sqlUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: 'SELECT version();' })
  });
  console.log(`SQL response status: ${sqlResponse.status}`);
  if (!sqlResponse.ok) {
    const errorText = await sqlResponse.text();
    console.error(`SQL response error: ${errorText}`);
  } else {
    const sqlData = await sqlResponse.json();
    console.log(`SQL response: ${JSON.stringify(sqlData, null, 2)}`);
  }
}

testToken().catch(console.error);