import type { Invoice } from './types';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(amount: number): string {
  return `£${Math.abs(amount).toFixed(2)}`;
}

export function generateInvoiceHTML(invoice: Invoice, businessName?: string): string {
  const invoiceNumber = invoice.id.slice(0, 8).toUpperCase();
  const fromName = businessName || 'QuidSafe';
  const statusLabel = invoice.status.toUpperCase();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${escapeHtml(invoiceNumber)}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: #ffffff; color: #111111; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
    }
    .mono {
      font-family: 'JetBrains Mono', 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
      font-variant-numeric: tabular-nums;
    }
    .sheet { max-width: 170mm; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 16px;
      border-bottom: 2px solid #111111;
      margin-bottom: 32px;
    }
    .from-block .from-name {
      font-size: 16pt;
      font-weight: 700;
      letter-spacing: -0.2px;
      color: #111111;
    }
    .from-block .from-role {
      font-size: 9pt;
      color: #6b6b6b;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-top: 4px;
    }
    .title-block { text-align: right; }
    .title-block .title {
      font-size: 32pt;
      font-weight: 300;
      letter-spacing: 4px;
      color: #111111;
      line-height: 1;
    }
    .title-block .number {
      margin-top: 8px;
      font-size: 12pt;
      font-weight: 700;
      color: #111111;
    }
    .parties {
      display: table;
      width: 100%;
      margin-bottom: 32px;
      border-collapse: collapse;
    }
    .party {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      padding-right: 24px;
    }
    .party + .party { padding-right: 0; padding-left: 24px; }
    .label {
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #6b6b6b;
      margin-bottom: 8px;
    }
    .party-name {
      font-size: 12pt;
      font-weight: 600;
      color: #111111;
      margin-bottom: 2px;
    }
    .party-line { font-size: 10.5pt; color: #333333; }
    .meta {
      display: table;
      width: 100%;
      margin-bottom: 24px;
      border-top: 1px solid #e5e5e5;
      border-bottom: 1px solid #e5e5e5;
    }
    .meta-cell {
      display: table-cell;
      width: 33.33%;
      padding: 12px 0;
      vertical-align: top;
    }
    .meta-cell + .meta-cell { padding-left: 16px; }
    .meta-value {
      font-size: 11pt;
      font-weight: 600;
      color: #111111;
      margin-top: 2px;
    }
    .status-pill {
      display: inline-block;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 3px 10px;
      border-radius: 3px;
      border: 1px solid #111111;
      color: #111111;
    }
    .status-paid { border-color: #0a7a3b; color: #0a7a3b; }
    .status-overdue { border-color: #b42318; color: #b42318; }
    .status-sent { border-color: #0066FF; color: #0066FF; }
    .status-draft { border-color: #6b6b6b; color: #6b6b6b; }
    table.items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    table.items thead th {
      text-align: left;
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #6b6b6b;
      padding: 10px 0;
      border-bottom: 1px solid #111111;
    }
    table.items thead th.right { text-align: right; }
    table.items tbody td {
      padding: 14px 0;
      border-bottom: 1px solid #e5e5e5;
      font-size: 11pt;
      color: #111111;
      vertical-align: top;
    }
    table.items tbody td.right { text-align: right; }
    .totals {
      width: 100%;
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .totals-inner { width: 55%; }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 11pt;
      color: #333333;
    }
    .totals-row.grand {
      border-top: 2px solid #111111;
      margin-top: 4px;
      padding-top: 14px;
      font-size: 14pt;
      font-weight: 700;
      color: #111111;
    }
    .footer {
      margin-top: 48px;
      padding-top: 14px;
      border-top: 1px solid #e5e5e5;
      text-align: right;
      font-size: 8.5pt;
      color: #9a9a9a;
      letter-spacing: 0.3px;
    }
    .footer .accent {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: #0066FF;
      border-radius: 1px;
      margin-right: 6px;
      vertical-align: middle;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="from-block">
        <div class="from-name">${escapeHtml(fromName)}</div>
        <div class="from-role">Sole Trader</div>
      </div>
      <div class="title-block">
        <div class="title">INVOICE</div>
        <div class="number">#${escapeHtml(invoiceNumber)}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <div class="label">From</div>
        <div class="party-name">${escapeHtml(fromName)}</div>
        <div class="party-line">United Kingdom</div>
      </div>
      <div class="party">
        <div class="label">Bill To</div>
        <div class="party-name">${escapeHtml(invoice.clientName)}</div>
        ${invoice.clientEmail ? `<div class="party-line">${escapeHtml(invoice.clientEmail)}</div>` : ''}
      </div>
    </div>

    <div class="meta">
      <div class="meta-cell">
        <div class="label">Issue Date</div>
        <div class="meta-value">${formatDate(invoice.createdAt)}</div>
      </div>
      <div class="meta-cell">
        <div class="label">Due Date</div>
        <div class="meta-value">${formatDate(invoice.dueDate)}</div>
      </div>
      <div class="meta-cell">
        <div class="label">Status</div>
        <div class="meta-value">
          <span class="status-pill status-${escapeHtml(invoice.status)}">${escapeHtml(statusLabel)}</span>
        </div>
        ${invoice.paidAt ? `<div class="party-line" style="margin-top:6px;">Paid ${formatDate(invoice.paidAt)}</div>` : ''}
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>Description</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(invoice.description)}</td>
          <td class="right mono">${formatAmount(invoice.amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-inner">
        <div class="totals-row">
          <span>Subtotal</span>
          <span class="mono">${formatAmount(invoice.amount)}</span>
        </div>
        <div class="totals-row grand">
          <span>Total Due</span>
          <span class="mono">${formatAmount(invoice.amount)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <span class="accent"></span>Sent via QuidSafe
    </div>
  </div>
</body>
</html>`;
}
