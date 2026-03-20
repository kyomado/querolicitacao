import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// NOTA: Em produção, estas chaves devem vir de variáveis de ambiente (.env)
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'TEST-YOUR-ACCESS-TOKEN';

const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

export async function POST(request: Request) {
  try {
    const { planId, userId, userEmail } = await request.json();

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: planId,
            title: 'Plano Pro - Quero Licitação',
            quantity: 1,
            unit_price: 197.00,
            currency_id: 'BRL',
          }
        ],
        payer: {
          email: userEmail,
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=success`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=failure`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=pending`,
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
