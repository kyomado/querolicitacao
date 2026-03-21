import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_SMTP_USER,
    pass: process.env.ZOHO_SMTP_PASS,
  },
});

export interface BiddingAlert {
  id: string;
  title: string;
  agency: string;
  location: string;
  modality: string;
  value?: number;
  endDate?: string;
  link?: string;
  source: string;
}

export async function sendAlertEmail(
  to: string,
  userName: string,
  biddings: BiddingAlert[],
  keywords: string[],
) {
  const formattedBiddings = biddings.slice(0, 15).map((b) => {
    const valor = b.value
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(b.value)
      : 'Sob Consulta';
    const prazo = b.endDate
      ? new Date(b.endDate).toLocaleDateString('pt-BR')
      : '—';

    return `
      <tr>
        <td style="padding:12px 8px; border-bottom:1px solid #1e1e2e;">
          <div style="font-weight:600; color:#e2e8f0; font-size:13px; margin-bottom:4px;">${b.title || `Edital ${b.id}`}</div>
          <div style="font-size:11px; color:#94a3b8;">${b.agency} · ${b.location}</div>
        </td>
        <td style="padding:12px 8px; border-bottom:1px solid #1e1e2e; text-align:center;">
          <span style="background:#1e3a5f; color:#60a5fa; font-size:10px; padding:3px 8px; border-radius:9999px; font-weight:700;">${b.source}</span>
        </td>
        <td style="padding:12px 8px; border-bottom:1px solid #1e1e2e; color:#4ade80; font-weight:700; font-size:13px; text-align:right;">${valor}</td>
        <td style="padding:12px 8px; border-bottom:1px solid #1e1e2e; color:#a78bfa; font-size:12px; text-align:center;">${prazo}</td>
        <td style="padding:12px 8px; border-bottom:1px solid #1e1e2e; text-align:center;">
          ${b.link ? `<a href="${b.link}" style="background:#7c3aed; color:#fff; font-size:10px; padding:5px 12px; border-radius:6px; text-decoration:none; font-weight:700;">Ver Edital</a>` : '—'}
        </td>
      </tr>
    `;
  }).join('');

  const keywordsText = keywords.length > 0 ? keywords.join(', ') : 'busca geral';
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:700px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:1px solid #2d2d4e;border-radius:16px;padding:28px 32px;margin-bottom:24px;text-align:center;">
      <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#3b82f6);width:40px;height:40px;border-radius:10px;line-height:40px;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">Q</div>
      <div style="font-size:11px;color:#6366f1;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px;">querolicitacao.com.br</div>
      <h1 style="color:#f1f5f9;font-size:22px;margin:0 0 6px;">🔔 Alerta de Licitações</h1>
      <p style="color:#64748b;font-size:13px;margin:0;">${today}</p>
    </div>

    <!-- Summary -->
    <div style="background:#12121f;border:1px solid #1e1e2e;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="color:#94a3b8;font-size:14px;margin:0 0 8px;">Olá, <strong style="color:#e2e8f0;">${userName}</strong>!</p>
      <p style="color:#94a3b8;font-size:14px;margin:0;">Encontramos <strong style="color:#a78bfa;">${biddings.length} licitações</strong> com base em suas palavras-chave: <strong style="color:#60a5fa;">${keywordsText}</strong></p>
    </div>

    <!-- Table -->
    <div style="background:#12121f;border:1px solid #1e1e2e;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <thead>
          <tr style="background:#0f0f1a;">
            <th style="padding:12px 8px;text-align:left;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Licitação</th>
            <th style="padding:12px 8px;text-align:center;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Fonte</th>
            <th style="padding:12px 8px;text-align:right;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Estimativa</th>
            <th style="padding:12px 8px;text-align:center;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Sessão</th>
            <th style="padding:12px 8px;text-align:center;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Ação</th>
          </tr>
        </thead>
        <tbody>${formattedBiddings}</tbody>
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="https://querolicitacao.com.br/dashboard" style="background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;display:inline-block;">
        Ver todas no Dashboard →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:16px;">
      <p style="color:#334155;font-size:11px;margin:0;">querolicitacao.com.br · Você está recebendo porque ativou alertas por e-mail.</p>
      <p style="color:#334155;font-size:11px;margin:4px 0 0;">Para desativar, acesse Dashboard → Configurações → Alertas por E-mail</p>
    </div>

  </div>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `"Quero Licitação 🔔" <${process.env.ZOHO_SMTP_USER}>`,
    to,
    subject: `🔔 ${biddings.length} novas licitações encontradas — ${today}`,
    html,
  });
}
