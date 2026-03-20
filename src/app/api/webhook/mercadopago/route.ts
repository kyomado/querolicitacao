import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
});

// Supabase admin client (service role) para escrever sem RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // O MP envia o tipo e o ID do recurso
    const { type, data } = body;

    // Só processa eventos de pagamento
    if (type !== 'payment') {
      return NextResponse.json({ received: true });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
    }

    // Busca os detalhes do pagamento na API do MP
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    // Processa apenas pagamentos aprovados
    if (paymentData.status !== 'approved') {
      return NextResponse.json({ received: true, status: paymentData.status });
    }

    // `external_reference` foi definido como o userId no checkout
    const userId = paymentData.external_reference;
    if (!userId) {
      console.error('Webhook: pagamento aprovado sem external_reference (userId)');
      return NextResponse.json({ received: true });
    }

    // Cria/atualiza assinatura no Supabase por 31 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 31);

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          status: 'active',
          plan_id: 'mensal-30',
          starts_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (error) {
      console.error('Webhook: erro ao salvar assinatura:', error);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    console.log(`Webhook: assinatura ativada para user ${userId} até ${expiresAt.toISOString()}`);
    return NextResponse.json({ received: true, activated: true });

  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
