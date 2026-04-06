// Push notification service — Expo Push API
// Sends notifications to registered devices via Expo's push notification infrastructure

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushMessage {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

export interface NotificationTemplate {
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// ─── Notification Templates ──────────────────────────────

export function deadlineReminder14Days(quarter: number, deadline: string, estimated: string): NotificationTemplate {
  return {
    type: 'deadline_reminder',
    title: `Q${quarter} payment due in 14 days`,
    body: `Your Q${quarter} payment is due on ${deadline}. Estimated: ${estimated}.`,
    data: { screen: 'tax', quarter: String(quarter) },
  };
}

export function deadlineUrgent3Days(quarter: number, deadline: string): NotificationTemplate {
  return {
    type: 'deadline_urgent',
    title: `Q${quarter} payment due in 3 days`,
    body: `Q${quarter} payment due on ${deadline}. Don't get hit with a late penalty.`,
    data: { screen: 'tax', quarter: String(quarter) },
  };
}

export function weeklySummary(income: string, sources: number, taxToSetAside: string): NotificationTemplate {
  return {
    type: 'weekly_summary',
    title: 'Weekly income summary',
    body: `Last week you earned ${income} from ${sources} source${sources === 1 ? '' : 's'}. Tax to set aside: ${taxToSetAside}.`,
    data: { screen: 'dashboard' },
  };
}

export function monthlyTaxPotCheck(percentage: number): NotificationTemplate {
  return {
    type: 'tax_pot_check',
    title: 'Monthly tax pot check',
    body: percentage >= 90
      ? `You've set aside ${percentage}% of what you owe. Nice one.`
      : `You've set aside ${percentage}% of what you owe. Consider topping up.`,
    data: { screen: 'dashboard' },
  };
}

export function mtdSubmissionReady(quarter: number): NotificationTemplate {
  return {
    type: 'mtd_ready',
    title: 'HMRC submission ready',
    body: `Your Q${quarter} update is ready to submit to HMRC. Tap to review.`,
    data: { screen: 'mtd', quarter: String(quarter) },
  };
}

export function bankReauthNeeded(bankName: string, daysLeft: number): NotificationTemplate {
  return {
    type: 'bank_reauth',
    title: 'Bank reconnection needed',
    body: `Your ${bankName} connection expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Tap to reconnect.`,
    data: { screen: 'settings' },
  };
}

export function trialEnding(daysLeft: number): NotificationTemplate {
  return {
    type: 'trial_ending',
    title: 'Your trial ends soon',
    body: `Your trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Add payment to keep your data.`,
    data: { screen: 'billing' },
  };
}

// ─── UK Tax Deadlines ────────────────────────────────────

export interface TaxDeadline {
  name: string;
  date: string; // ISO date
  quarter?: number;
}

export function getUKTaxDeadlines(taxYear: string): TaxDeadline[] {
  const startYear = parseInt(taxYear.split('/')[0], 10);
  const endYear = startYear + 1;

  return [
    { name: 'Q1 quarterly update', date: `${startYear}-08-05`, quarter: 1 },
    { name: 'Q2 quarterly update', date: `${startYear}-11-05`, quarter: 2 },
    { name: 'Q3 quarterly update', date: `${endYear}-02-05`, quarter: 3 },
    { name: 'Q4 quarterly update', date: `${endYear}-05-05`, quarter: 4 },
    { name: 'Self Assessment deadline', date: `${endYear}-01-31` },
    { name: 'Payment on Account 1', date: `${endYear}-01-31` },
    { name: 'Payment on Account 2', date: `${endYear}-07-31` },
  ];
}

// ─── Send Notifications via Expo Push API ────────────────

export async function sendPushNotifications(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  // Expo Push API supports batches of up to 100
  const chunks: PushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunk),
    });
  }
}

// ─── Build push messages for a notification template ─────

export function buildPushMessages(
  tokens: string[],
  template: NotificationTemplate,
): PushMessage[] {
  return tokens.map((token) => ({
    to: token,
    title: template.title,
    body: template.body,
    data: template.data,
    sound: 'default' as const,
  }));
}
