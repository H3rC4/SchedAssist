import { NextRequest, NextResponse } from 'next/server';

// Este endpoint legacy redirige a /api/checkout/stripe
// Mercado Pago fue eliminado - solo se usa Stripe

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Este endpoint está obsoleto. Usa /api/checkout/stripe.',
      stripe: '/api/checkout/stripe',
    },
    { status: 410 }
  );
}
