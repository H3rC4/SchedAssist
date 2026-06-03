const fetch = require('node-fetch');

const projectRef = process.env.PROJECT_REF || 'gtpnikqxhqgoohqqdzhg';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

console.log('Service Role Key exists:', !!serviceRoleKey);
if (serviceRoleKey) {
  console.log('Service Role Key (first 20 chars):', serviceRoleKey.substring(0, 20));
}
console.log('Project Ref:', projectRef);

async function testProjectEndpoint() {
  const url = `https://api.supabase.com/v1/projects/${projectRef}`;
  console.log('Testing URL:', url);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testSqlEndpoint() {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/sql`;
  console.log('Testing SQL URL:', url);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'SELECT 1;' })
    });
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testProjectEndpoint().then(() => testSqlEndpoint());