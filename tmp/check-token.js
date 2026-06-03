// We don't have the jsonwebtoken package installed, so let's do it manually.
// The token is in three parts separated by dots.
var token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0cG5pa3F4aHFnb29ocXFkemhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgwNDk3NiwiZXhwIjoyMDkwMzgwOTc2fQ.h7sSHgccL-Uf-hMWMfEzD-2e0cxNqvH-wOk5Cot-b0o";

var parts = token.split('.');
var headerB64 = parts[0];
var payloadB64 = parts[1];
var signatureB64 = parts[2];

// Function to decode base64url
function decodeBase64Url(str) {
  // Replace - and _ with + and /
  var normalized = str.replace(/-/g, '+').replace(/_/g, '/');
  // Pad to multiple of 4
  var pad = normalized.length % 4;
  if (pad) {
    normalized += '='.repeat(4 - pad);
  }
  // Decode
  return Buffer.from(normalized, 'base64').toString('utf8');
}

try {
  var header = JSON.parse(decodeBase64Url(headerB64));
  var payload = JSON.parse(decodeBase64Url(payloadB64));
  console.log('Header:', JSON.stringify(header, null, 2));
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  var now = Math.floor(Date.now() / 1000);
  console.log('Now (seconds):', now);
  console.log('Exp (seconds):', payload.exp);
  console.log('Token expired:', payload.exp < now);
} catch (e) {
  console.error('Error decoding token:', e.message);
}