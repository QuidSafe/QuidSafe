// Invoice email delivery via Resend (raw fetch - no SDK, Workers compatible)

interface InvoiceEmailData {
  clientName: string;
  clientEmail: string;
  amount: number;
  description: string;
  dueDate: string;
  invoiceId: string;
  senderName: string;
}

interface ResendConfig {
  apiKey: string;
  fromEmail: string;
}

function formatCurrency(amount: number): string {
  return `\u00A3${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function buildInvoiceHtml(data: InvoiceEmailData): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; }
    .container { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #ffffff; border-radius: 8px; padding: 32px; }
    .header { font-size: 20px; font-weight: 600; margin-bottom: 24px; }
    .from { color: #666666; font-size: 14px; margin-bottom: 24px; }
    .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eeeeee; }
    .row:last-child { border-bottom: none; }
    .label { color: #666666; font-size: 14px; }
    .value { font-size: 14px; font-weight: 600; text-align: right; }
    .amount { font-size: 24px; font-weight: 700; color: #0066FF; margin: 24px 0; text-align: center; }
    .footer { text-align: center; margin-top: 24px; color: #999999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">Invoice from ${escapeHtml(data.senderName)}</div>
      <div class="from">Sent to ${escapeHtml(data.clientName)}</div>
      <div class="amount">${formatCurrency(data.amount)}</div>
      <div class="row">
        <span class="label">Description</span>
        <span class="value">${escapeHtml(data.description)}</span>
      </div>
      <div class="row">
        <span class="label">Due Date</span>
        <span class="value">${formatDate(data.dueDate)}</span>
      </div>
    </div>
    <div class="footer">
      Sent via QuidSafe - Tax tracking for UK sole traders
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendInvoiceEmail(
  data: InvoiceEmailData,
  config: ResendConfig,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = buildInvoiceHtml(data);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${data.senderName.replace(/[<>"]/g, '')} via QuidSafe <${config.fromEmail}>`,
      to: [data.clientEmail],
      subject: `Invoice from ${data.senderName} - ${formatCurrency(data.amount)}`,
      html,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Email delivery failed' }));
    return {
      success: false,
      error: (err as { message?: string }).message || `Resend API error: ${response.status}`,
    };
  }

  const result = await response.json() as { id: string };
  return { success: true, messageId: result.id };
}
