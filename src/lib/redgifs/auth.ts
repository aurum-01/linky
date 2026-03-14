// ─── src/lib/redgifs/auth.ts ───────────────────────────────────────────────
//
// Implements the token lifecycle described in the API guide:
// - Single GET to /v2/auth/temporary
// - Cache token in module memory, reuse until exp
// - On 401 flush and retry exactly once
// - Consistent User-Agent between auth and all data requests

const AUTH_ENDPOINT = "https://api.redgifs.com/v2/auth/temporary";

// Must be identical across auth + all subsequent calls (PDF §User-Agent Validation)
export const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

let _token: string | null = null;
let _tokenExpiry = 0; // ms epoch
let _inflight: Promise<string> | null = null; // prevent duplicate auth requests

export async function getToken(): Promise<string> {
  const now = Date.now();
  // Return cached token if still valid (with 60s safety buffer)
  if (_token && now < _tokenExpiry - 60_000) return _token;

  // Coalesce concurrent calls — only one auth request at a time
  if (_inflight) return _inflight;

  _inflight = _fetchToken().finally(() => { _inflight = null; });
  return _inflight;
}

async function _fetchToken(): Promise<string> {
  const res = await fetch(AUTH_ENDPOINT, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent": UA,
      Referer: "https://www.redgifs.com/",
      Origin: "https://www.redgifs.com",
    },
    // Next.js: skip cache for auth calls so token is always fresh
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`RedGIFs auth failed ${res.status}: ${body}`);
  }

  const json: any = await res.json();
  const token: string = json.token || json.access_token || json.bearer;
  if (!token) throw new Error("No token field in RedGIFs auth response");

  // PDF: guest tokens last ~24h–2w; use expires_in if present
  const expiresIn: number = json.expires_in || json.expires || 86_400;
  _token = token;
  _tokenExpiry = Date.now() + expiresIn * 1_000;

  return token;
}

export function invalidateToken(): void {
  _token = null;
  _tokenExpiry = 0;
}

export function buildAuthHeaders(token: string): Record<string, string> {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "User-Agent": UA, // must match auth UA exactly (PDF §User-Agent Validation)
    Referer: "https://www.redgifs.com/",
    Origin: "https://www.redgifs.com",
  };
}