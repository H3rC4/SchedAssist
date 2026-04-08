import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY no está configurada en el archivo .env');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // @ts-ignore
  apiVersion: null, 
  appInfo: {
    name: 'SchedAssist SaaS',
    version: '0.1.0',
  },
});
