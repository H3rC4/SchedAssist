const { TOTP } = require('otplib');
const totp = new TOTP();
try {
    const sec = totp.generateSecret();
    console.log('Secret:', sec);
    const uri = totp.generateURI('test@example.com', 'TestIssuer', sec);
    console.log('URI:', uri);
} catch (e) {
    console.error('Error:', e.message);
}
