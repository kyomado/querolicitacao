import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { searchAllBiddings } from '@/lib/bidding-service';
import { sendAlertEmail, BiddingAlert } from '@/lib/email-service';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: Request) {
  // Protege a rota com segredo
  const auth = request.headers.get('authorization');
  const secret = `Bearer ${process.env.CRON_SECRET}`;
  if (auth !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Hora atual em Brasília (UTC-3)
    const nowUTC = new Date();
    const brasiliaOffset = -3 * 60; // UTC-3 em minutos
    const nowBrasilia = new Date(nowUTC.getTime() + brasiliaOffset * 60 * 1000);
    const currentHour = nowBrasilia.getUTCHours(); // Hora atual em Brasília

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Busca apenas usuários cujo horário de alerta bate com a hora atual (ou todos se force=true)
    let query = supabaseAdmin
      .from('user_settings')
      .select('user_id, alert_email, default_keywords, default_ufs, default_days_range, alert_hour')
      .eq('email_alerts_enabled', true)
      .not('alert_email', 'is', null);

    if (!force) {
      query = query.eq('alert_hour', currentHour);
    }

    const { data: settings, error } = await query;

    if (error) throw error;
    if (!settings || settings.length === 0) {
      return NextResponse.json({ sent: 0, message: 'Nenhum usuário com alertas ativos' });
    }

    let sent = 0;
    const errors: string[] = [];

    for (const s of settings) {
      try {
        const keywords: string[] = s.default_keywords ? s.default_keywords.split(',').filter(Boolean) : [];
        const ufs: string[] = s.default_ufs || [];
        // Janela de 24h: sempre busca do dia anterior até hoje
        const days: number = 1;

        // Busca licitações com os filtros do usuário (últimas 24h)
        const results = await searchAllBiddings(
          ufs,
          keywords.join(' '),
          [], // modalidades (todas)
          [], // municípios (todos)
          undefined, // sem AbortController no cron
          days,
        );

        if (results.length === 0) continue;

        // Busca o nome do usuário
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(s.user_id);
        const userName = userData?.user?.user_metadata?.full_name
          || userData?.user?.email?.split('@')[0]
          || 'Usuário';

        // Converte para o formato de alerta
        const alertBiddings: BiddingAlert[] = results.slice(0, 15).map((b) => ({
          id: b.id,
          title: b.title,
          agency: b.agency || 'Órgão Público',
          location: b.location || '—',
          modality: b.modality || '—',
          value: b.value,
          endDate: b.endDate,
          link: b.link,
          source: b.source || 'PNCP',
        }));

        await sendAlertEmail(s.alert_email, userName, alertBiddings, keywords);
        sent++;
        console.log(`Alerta enviado para ${s.alert_email} (${results.length} licitações)`);
      } catch (err) {
        const msg = `Erro ao enviar para ${s.alert_email}: ${err}`;
        errors.push(msg);
        console.error(msg);
      }
    }

    return NextResponse.json({
      sent,
      total: settings.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('Cron send-alerts error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
