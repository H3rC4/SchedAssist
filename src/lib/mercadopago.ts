import { MercadoPagoConfig } from 'mercadopago';

const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

if (!mpAccessToken && process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  console.warn('MERCADOPAGO_ACCESS_KEY no está configurada. Los pagos de Argentina no funcionarán.');
}

export const mpClient = new MercadoPagoConfig({ 
  accessToken: mpAccessToken,
  options: { timeout: 5000 }
});
