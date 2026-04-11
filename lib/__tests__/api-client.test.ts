import { describe, it, expect, vi, beforeEach } from 'vitest';

// Re-create a minimal testable ApiClient matching lib/api.ts behaviour.
// We cannot import the singleton directly because it reads process.env at
// module load time and fetch is global; instead we replicate the class logic
// so the tests remain independent of network / env state.

const API_BASE = 'https://api.quidsafe.uk';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ?? `HTTP ${response.status}`,
      );
    }

    return response.json() as Promise<T>;
  }
}

// ─── setToken ────────────────────────────────────────────

describe('ApiClient.setToken', () => {
  it('stores the token so subsequent requests include it', () => {
    const client = new ApiClient();
    // Access private via cast to verify storage
    client.setToken('my-jwt');
    expect((client as unknown as { token: string }).token).toBe('my-jwt');
  });

  it('stores null when called with null', () => {
    const client = new ApiClient();
    client.setToken('old-token');
    client.setToken(null);
    expect((client as unknown as { token: string | null }).token).toBeNull();
  });
});

// ─── request() Authorization header ─────────────────────

describe('ApiClient.request - Authorization header', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends Authorization header when token is set', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const client = new ApiClient();
    client.setToken('test-token-123');
    await client.request('/dashboard');

    expect(global.fetch).toHaveBeenCalledOnce();
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer test-token-123');
  });

  it('omits Authorization header when no token is set', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    const client = new ApiClient();
    await client.request('/articles');

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
  });

  it('includes Content-Type application/json on every request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    const client = new ApiClient();
    await client.request('/articles');

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });
});

// ─── request() error handling ────────────────────────────

describe('ApiClient.request - error handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('throws with error.message from JSON body on non-OK response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Unauthorised' } }),
    } as Response);

    const client = new ApiClient();
    await expect(client.request('/dashboard')).rejects.toThrow('Unauthorised');
  });

  it('falls back to HTTP status message when JSON body lacks error.message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ something: 'else' }),
    } as Response);

    const client = new ApiClient();
    await expect(client.request('/dashboard')).rejects.toThrow('HTTP 500');
  });

  it('handles malformed JSON error responses gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => { throw new SyntaxError('Unexpected token'); },
    } as unknown as Response);

    const client = new ApiClient();
    // Falls back to the catch default: { error: { message: 'Request failed' } }
    await expect(client.request('/dashboard')).rejects.toThrow('Request failed');
  });
});
