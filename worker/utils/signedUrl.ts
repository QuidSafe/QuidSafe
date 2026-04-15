// Signed URL helpers for shareable resources (invoices, exports, etc).
//
// When you need to share a URL externally (via email, link, etc) that would
// otherwise leak if the ID is guessed, wrap it with sign() and pass the
// sig + exp query params. Verify on the receiving side with verify().
//
// Example use:
//   const shareUrl = `https://quidsafe.uk/invoice/${id}?${sign('invoice', id, env.SIGNING_KEY, 7)}`;
//   // On receipt: if (!await verify('invoice', id, req.query, env.SIGNING_KEY)) return 403;

const encoder = new TextEncoder();

async function hmac(key: string, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generate signed query params for a resource URL.
 * @param resource Type of resource (e.g. 'invoice')
 * @param id Resource ID
 * @param signingKey Secret HMAC key
 * @param ttlDays How many days until the link expires (default 7)
 * @returns Query string like "sig=abc&exp=1234567890"
 */
export async function sign(
  resource: string,
  id: string,
  signingKey: string,
  ttlDays = 7,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlDays * 86400;
  const sig = await hmac(signingKey, `${resource}|${id}|${exp}`);
  return `sig=${sig}&exp=${exp}`;
}

/**
 * Verify a signed query against a resource.
 * @returns true if signature is valid and not expired.
 */
export async function verify(
  resource: string,
  id: string,
  query: { sig?: string | null; exp?: string | null },
  signingKey: string,
): Promise<boolean> {
  const { sig, exp } = query;
  if (!sig || !exp) return false;
  const expNum = parseInt(exp, 10);
  if (Number.isNaN(expNum) || expNum < Math.floor(Date.now() / 1000)) return false;

  const expected = await hmac(signingKey, `${resource}|${id}|${expNum}`);
  // Timing-safe comparison on strings of equal length (sigs are fixed-length base64)
  if (sig.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < sig.length; i++) mismatch |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return mismatch === 0;
}
