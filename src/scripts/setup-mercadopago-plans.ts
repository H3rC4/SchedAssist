import { MercadoPagoConfig, PreApprovalPlan } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const mpClient = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

// Use production URL for Mercado Pago (cannot use localhost)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.schedassist.com/';

// Configuración de planes para Argentina (ARS)
const MP_PLANS = [
  { tier: 'basic', cycle: 'monthly', name: 'SchedAssist Starter Mensual', amount: 60000, frequency: 1 },
  { tier: 'basic', cycle: 'yearly', name: 'SchedAssist Starter Anual', amount: 600000, frequency: 12 },
  { tier: 'pro', cycle: 'monthly', name: 'SchedAssist Pro Mensual', amount: 90000, frequency: 1 },
  { tier: 'pro', cycle: 'yearly', name: 'SchedAssist Pro Anual', amount: 900000, frequency: 12 },
  { tier: 'premium', cycle: 'monthly', name: 'SchedAssist Premium Mensual', amount: 195000, frequency: 1 },
  { tier: 'premium', cycle: 'yearly', name: 'SchedAssist Premium Anual', amount: 1950000, frequency: 12 },
];

async function setupMercadoPagoPlans() {
  console.log('=== Setup Mercado Pago Plans ===\n');
  
  const preApprovalPlan = new PreApprovalPlan(mpClient);
  const createdPlans: any[] = [];

  for (const plan of MP_PLANS) {
    try {
      console.log(`Creando plan: ${plan.name} - $${plan.amount} ARS`);
      
      const response = await preApprovalPlan.create({
        body: {
          auto_recurring: {
            frequency: plan.frequency,
            frequency_type: 'months',
            transaction_amount: plan.amount,
            currency_id: 'ARS',
          },
          back_url: `${SITE_URL}/dashboard/settings/billing`,
          reason: plan.name,
        }
      });

      console.log(`✅ Creado: ${response.id}`);
      createdPlans.push({
        tier: plan.tier,
        cycle: plan.cycle,
        plan_id: response.id,
        name: plan.name,
        amount: plan.amount,
      });

      // Actualizar plan_configs con el ID de MP
      const column = plan.cycle === 'monthly' ? 'mp_plan_monthly' : 'mp_plan_yearly';
      
      const { error } = await supabase
        .from('plan_configs')
        .update({ [column]: response.id })
        .eq('tier', plan.tier);

      if (error) {
        console.error(`Error guardando plan_id en DB:`, error);
      }

    } catch (error: any) {
      console.error(`❌ Error creando ${plan.name}:`, error.message);
    }
  }

  console.log('\n=== Resumen ===');
  console.log('Planes creados:', createdPlans.length);
  console.log('\nActualiza tu .env con estos IDs:');
  createdPlans.forEach(p => {
    const envVar = `MP_PLAN_${p.tier.toUpperCase()}_${p.cycle.toUpperCase()}`;
    console.log(`${envVar}=${p.plan_id}`);
  });

  // Mostrar también para copiar/pegar
  console.log('\n=== .env ===');
  createdPlans.forEach(p => {
    const envVar = `MP_PLAN_${p.tier.toUpperCase()}_${p.cycle.toUpperCase()}`;
    console.log(`${envVar}=${p.plan_id}`);
  });
}

setupMercadoPagoPlans().catch(console.error);
