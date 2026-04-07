// HMRC Making Tax Digital (MTD) API integration
// Handles OAuth, quarterly submissions, and obligations
// API docs: https://developer.service.hmrc.gov.uk/api-documentation

const HMRC_API_BASE = 'https://api.service.hmrc.gov.uk';
const HMRC_AUTH_URL = 'https://www.tax.service.gov.uk/oauth/authorize';
const HMRC_TOKEN_URL = `${HMRC_API_BASE}/oauth/token`;

export interface HmrcConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface HmrcTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface MtdObligation {
  periodKey: string;
  start: string;
  end: string;
  due: string;
  status: 'Open' | 'Fulfilled';
  received?: string;
}

export interface MtdSubmissionPayload {
  periodStart: string;
  periodEnd: string;
  totalIncome: number;
  totalExpenses: number;
}

export interface MtdSubmissionResponse {
  id: string;
  obligationsAreMet: boolean;
}

// ─── OAuth Flow ──────────────────────────────────────────

export function getHmrcAuthUrl(config: HmrcConfig, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    scope: 'read:self-assessment write:self-assessment',
    state,
    redirect_uri: config.redirectUri,
  });
  return `${HMRC_AUTH_URL}?${params.toString()}`;
}

export async function exchangeHmrcCode(
  code: string,
  config: HmrcConfig,
): Promise<HmrcTokens> {
  const response = await fetch(HMRC_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HMRC token exchange failed: ${error}`);
  }

  const data = await response.json() as { access_token: string; refresh_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function refreshHmrcToken(
  refreshToken: string,
  config: HmrcConfig,
): Promise<HmrcTokens> {
  const response = await fetch(HMRC_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error('HMRC token refresh failed');
  }

  const data = await response.json() as { access_token: string; refresh_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

// ─── MTD API Calls ───────────────────────────────────────

export async function getObligations(
  accessToken: string,
  nino: string,
): Promise<MtdObligation[]> {
  const selfEmploymentUrl = `${HMRC_API_BASE}/individuals/self-assessment/income-tax/self-employments/${nino}/obligations`;

  const response = await fetch(selfEmploymentUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.hmrc.2.0+json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HMRC obligations fetch failed: ${error}`);
  }

  const data = await response.json() as { obligations: { obligation: MtdObligation[] }[] };
  return data.obligations.flatMap((o) => o.obligation);
}

export async function submitQuarterlyUpdate(
  accessToken: string,
  nino: string,
  payload: MtdSubmissionPayload,
): Promise<MtdSubmissionResponse> {
  const url = `${HMRC_API_BASE}/individuals/self-assessment/income-tax/self-employments/${nino}/periodic-summaries`;

  const body = {
    from: payload.periodStart,
    to: payload.periodEnd,
    incomes: {
      turnover: {
        amount: payload.totalIncome,
      },
    },
    deductions: {
      costOfGoods: {
        amount: payload.totalExpenses,
      },
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.hmrc.2.0+json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();

    if (response.status === 403) {
      throw new Error('HMRC_INVALID_CREDENTIALS: Your HMRC connection needs reauthorising');
    }
    if (response.status === 409) {
      throw new Error('HMRC_ALREADY_SUBMITTED: This quarter has already been submitted');
    }
    if (response.status === 422) {
      throw new Error('HMRC_PERIOD_NOT_OPEN: This period is not yet open for submission');
    }

    throw new Error(`HMRC submission failed (${response.status}): ${error}`);
  }

  const data = await response.json() as { id: string; obligationsAreMet: boolean };
  return data;
}
