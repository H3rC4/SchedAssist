import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeKey && process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  console.warn('⚠️ STRIPE_SECRET_KEY no está configurada. Esto causará errores en las rutas de pago.');
}

export const stripe = new Stripe(stripeKey, {
  // @ts-ignore
  apiVersion: null, 
  appInfo: {
    name: 'SchedAssist SaaS',
    version: '0.1.0',
  },
});
