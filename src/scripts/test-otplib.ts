import * as otplib from 'otplib'; 
const auth: any = otplib.authenticator || (otplib as any).default?.authenticator || otplib;
async function test() {
  const secret = auth.generateSecret();
  console.log('Testing verify...');
  const res = auth.verify({ token: '123456', secret });
  console.log('Result type:', typeof res);
  console.log('Result:', res);
  console.log('is truthy?', !!res);
}
test();
