import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || '';

const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

export async function POST(request: Request) {
  try {
    const { planId, userId, userEmail } = await request.json();

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: planId || 'mensal-30',
            title: 'Plano Mensal - querolicitacao.com.br',
            quantity: 1,
            unit_price: 30.00,
            currency_id: 'BRL',
          }
        ],
        payer: {
          email: userEmail,
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=failure`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=pending`,
        },
        auto_return: 'approved',
        external_reference: userId,
      }
    });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error) {
    console.error('Erro ao criar preferência do Mercado Pago:', error);
    return NextResponse.json({ error: 'Erro ao processar checkout' }, { status: 500 });
  }
}
