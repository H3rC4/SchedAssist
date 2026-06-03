const fetch = require('node-fetch');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key exists:', !!anonKey);
console.log('Service Role Key exists:', !!serviceRoleKey);

async function testEndpoint(key, type) {
  const url = `${supabaseUrl}/auth/v1/settings`;
  console.log(`\nTesting ${type} key on ${url}`);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      },
    });
    console.log(`Status: ${response.status}`);
    const text = await response.text();
    console.log(`Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEndpoint(anonKey, 'anon').then(() => testEndpoint(serviceRoleKey, 'service_role'));