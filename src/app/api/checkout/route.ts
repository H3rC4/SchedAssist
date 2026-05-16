import { NextRequest, NextResponse } from 'next/server';

// Este endpoint legacy ahora está dividido en:
// POST /api/checkout/stripe - Para pagos internacionales (USD)
// POST /api/checkout/mercadopago - Para pagos de Argentina (ARS)
//
// El frontend debe detectar el país y llamar al endpoint correspondiente.

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Este endpoint está obsoleto. Usa /api/checkout/stripe o /api/checkout/mercadopago según el país.',
      stripe: '/api/checkout/stripe',
      mercadopago: '/api/checkout/mercadopago',
    },
    { status: 410 }
  );
}
