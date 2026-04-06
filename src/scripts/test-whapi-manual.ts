import { WhapiAdapter } from '../services/adapters/whapi.adapter';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Manual integration test for the Whapi.Cloud adapter.
 * Run with: npx tsx src/scripts/test-whapi-manual.ts
 */
async function testWhapi() {
  const token = process.env.WHAPI_API_TOKEN;

  if (!token) {
    console.error('Error: WHAPI_API_TOKEN not found in .env');
    return;
  }

  const testNumber = '34674457497'; // Replace with a real test number
  const testMessage = '🚀 Test WhapiAdapter\nSi recibes esto, el adapter está funcionando correctamente.';

  console.log(`Sending test message to ${testNumber} via WhapiAdapter...`);

  try {
    const adapter = new WhapiAdapter(token);
    await adapter.send({ to: testNumber, text: testMessage });
    console.log('✅ Message sent successfully via WhapiAdapter!');
  } catch (error: any) {
    console.error('❌ Failed to send message:', error.message);
  }
}

testWhapi();
