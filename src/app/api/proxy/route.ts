import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Segurança básica (bloquear SSRF) garantindo que só chamamos APIs permitidas
  if (!targetUrl.startsWith('https://pncp.gov.br/') && !targetUrl.startsWith('https://www.in.gov.br/')) {
    return NextResponse.json({ error: 'Domínio não permitido no proxy.' }, { status: 403 });
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        // Falsificar o User Agent ajuda a reduzir os bloqueios do WAF do governo
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      next: { revalidate: 0 } // Desativa o cache agressivo do Next.js
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erro no servidor de origem', status: response.status },
        { status: 200 } // Retorna 200 para não poluir o console do navegador com erros 404/500 do DOU/PNCP
      );
    }
    
    const text = await response.text();
    if (!text) {
      return NextResponse.json({});
    }
    
    // Tenta fazer o parse do JSON de retorno
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Erro ao parsear JSON da origem:', parseError);
      return NextResponse.json({ error: 'Resposta não é um JSON válido' }, { status: 200 }); // Retorna 200
    }

  } catch (error: any) {
    console.error('Erro no Proxy Fetch:', error);
    return NextResponse.json({ error: 'Erro de conexão no proxy', message: error.message }, { status: 200 }); // Retorna 200
  }
}
